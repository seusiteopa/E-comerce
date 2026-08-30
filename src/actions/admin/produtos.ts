"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { productAdminSchema } from "@/lib/validation/admin-schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function guardAdmin() {
  try {
    return await requireAdminProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new ForbiddenError();
  }
}

export async function createProductAction(formData: FormData): Promise<ActionResult<{ productId: string }>> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    categorySlug: formData.get("categorySlug") as string,
    newCategoryName: (formData.get("newCategoryName") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    promoPrice: formData.get("promoPrice") ? Number(formData.get("promoPrice")) : undefined,
    status: (formData.get("status") as string) || "rascunho",
    featured: formData.get("featured") === "on",
    hidden: formData.get("hidden") === "on",
  };

  const parsed = productAdminSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Verifique os campos do produto.", flatten(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(parsed.data.name);

  let categorySlug = parsed.data.categorySlug;

  if (parsed.data.newCategoryName) {
    const newSlug = slugify(parsed.data.newCategoryName);
    const { data: existing } = await supabase
      .from("categories")
      .select("slug")
      .eq("slug", newSlug)
      .maybeSingle();

    if (!existing) {
      const { error: categoryError } = await supabase.from("categories").insert({
        slug: newSlug,
        name: parsed.data.newCategoryName,
        product_type: parsed.data.type,
        active: true,
      });
      if (categoryError) {
        logger.error("Erro ao criar categoria inline", { error: categoryError.message });
        return actionError("Não foi possível criar a nova categoria.");
      }
    }
    categorySlug = newSlug;
  }

  if (!categorySlug) {
    return actionError("Selecione uma categoria ou informe o nome de uma categoria nova.");
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: parsed.data.name,
      type: parsed.data.type,
      category_slug: categorySlug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description,
      price: parsed.data.price,
      promo_price: parsed.data.promoPrice ?? null,
      status: parsed.data.status,
      featured: parsed.data.featured,
      hidden: parsed.data.hidden,
    })
    .select()
    .single();

  if (error || !product) {
    logger.error("Erro ao criar produto", { error: error?.message });
    return actionError("Não foi possível salvar o produto. O nome/slug já pode estar em uso.");
  }

  // Arquivo digital (ebook, PDF, ZIP...) já foi enviado direto pro
  // Cloudinary pelo navegador (ver src/lib/cloudinary-client.ts) — aqui só
  // recebe a URL pronta e registra em digital_assets.
  const digitalFileUrl = formData.get("digitalFileUrl") as string | null;
  if (parsed.data.type === "digital" && digitalFileUrl) {
    const { error: assetError } = await supabase.from("digital_assets").insert({
      product_id: product.id,
      storage_path: digitalFileUrl,
      provider: "cloudinary",
      delivery_type: "download",
    });
    if (assetError) {
      logger.error("Falha ao registrar arquivo digital no banco", { productId: product.id, error: assetError.message });
    }
  }

  // Produto físico sem variações de atributo (tamanho/cor) ainda precisa
  // de uma linha em product_variations para o estoque existir de fato —
  // sem isso o checkout trata como "sem variação disponível" = esgotado
  // sempre. Cria uma variação "padrão" (sem atributos) carregando o
  // estoque informado no formulário.
  if (parsed.data.type === "fisico") {
    const stock = Math.max(0, Number(formData.get("stock")) || 0);
    await supabase.from("product_variations").insert({
      product_id: product.id,
      attributes: {},
      stock,
      sku: `EST-${product.id.slice(0, 8).toUpperCase()}`,
    });
  }

  // Fotos e vídeo já foram enviados direto pro Cloudinary pelo navegador
  // (ver src/lib/cloudinary-client.ts) — aqui só recebe as URLs prontas,
  // sem o arquivo em si passar pelo servidor.
  const photoUrls = formData.getAll("photoUrls").filter((v): v is string => typeof v === "string" && v.length > 0);
  const videoUrl = formData.get("videoUrl") as string | null;

  const mediaRows: { product_id: string; url: string; alt_text: string; display_order: number; media_type: string }[] = [];

  photoUrls.forEach((url, i) => {
    mediaRows.push({ product_id: product.id, url, alt_text: parsed.data.name, display_order: i, media_type: "imagem" });
  });

  if (videoUrl) {
    mediaRows.push({ product_id: product.id, url: videoUrl, alt_text: parsed.data.name, display_order: mediaRows.length, media_type: "video" });
  }

  if (mediaRows.length > 0) {
    const { error: mediaError } = await supabase.from("product_images").insert(mediaRows);
    if (mediaError) {
      logger.error("Falha ao salvar mídias do produto no banco", { productId: product.id, error: mediaError.message });
    }
  }

  revalidatePath("/admin/produtos");
  return actionSuccess({ productId: product.id });
}

export async function updateProductAction(productId: string, formData: FormData): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    categorySlug: formData.get("categorySlug") as string,
    newCategoryName: (formData.get("newCategoryName") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    promoPrice: formData.get("promoPrice") ? Number(formData.get("promoPrice")) : undefined,
    status: (formData.get("status") as string) || "rascunho",
    featured: formData.get("featured") === "on",
    hidden: formData.get("hidden") === "on",
  };

  const parsed = productAdminSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Verifique os campos do produto.", flatten(parsed.error));
  }

  const supabase = await createSupabaseServerClient();

  let categorySlug = parsed.data.categorySlug;
  if (parsed.data.newCategoryName) {
    const newSlug = slugify(parsed.data.newCategoryName);
    const { data: existing } = await supabase.from("categories").select("slug").eq("slug", newSlug).maybeSingle();
    if (!existing) {
      const { error: categoryError } = await supabase.from("categories").insert({
        slug: newSlug,
        name: parsed.data.newCategoryName,
        product_type: parsed.data.type,
        active: true,
      });
      if (categoryError) return actionError("Não foi possível criar a nova categoria.");
    }
    categorySlug = newSlug;
  }
  if (!categorySlug) {
    return actionError("Selecione uma categoria ou informe o nome de uma categoria nova.");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      category_slug: categorySlug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description,
      price: parsed.data.price,
      promo_price: parsed.data.promoPrice ?? null,
      status: parsed.data.status,
      featured: parsed.data.featured,
      hidden: parsed.data.hidden,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    logger.error("Erro ao atualizar produto", { productId, error: error.message });
    return actionError("Não foi possível salvar as alterações do produto.");
  }

  // Arquivo digital novo (já enviado pro Cloudinary pelo navegador)
  // substitui o registro existente — apaga o antigo e insere o novo.
  const digitalFileUrl = formData.get("digitalFileUrl") as string | null;
  if (parsed.data.type === "digital" && digitalFileUrl) {
    await supabase.from("digital_assets").delete().eq("product_id", productId);
    const { error: assetError } = await supabase.from("digital_assets").insert({
      product_id: productId,
      storage_path: digitalFileUrl,
      provider: "cloudinary",
      delivery_type: "download",
    });
    if (assetError) {
      logger.error("Falha ao registrar arquivo digital no banco", { productId, error: assetError.message });
    }
  }

  // Estoque de produto físico sem variações — atualiza a variação "padrão"
  // já existente, ou cria uma se ainda não existir (produto criado antes
  // dessa funcionalidade existir, por exemplo).
  if (parsed.data.type === "fisico") {
    const stock = Math.max(0, Number(formData.get("stock")) || 0);
    const { data: existingVariation } = await supabase
      .from("product_variations")
      .select("id")
      .eq("product_id", productId)
      .limit(1)
      .maybeSingle();

    if (existingVariation) {
      await supabase.from("product_variations").update({ stock }).eq("id", existingVariation.id);
    } else {
      await supabase.from("product_variations").insert({
        product_id: productId,
        attributes: {},
        stock,
        sku: `EST-${productId.slice(0, 8).toUpperCase()}`,
      });
    }
  }

  // Fotos/vídeo novos (já enviados pro Cloudinary pelo navegador) são
  // ADICIONADOS às mídias existentes (não substituem). Para remover uma
  // mídia específica, usa deleteProductImageAction.
  const photoUrls = formData.getAll("photoUrls").filter((v): v is string => typeof v === "string" && v.length > 0);
  const videoUrl = formData.get("videoUrl") as string | null;

  if (photoUrls.length > 0 || videoUrl) {
    const { data: existingImages } = await supabase
      .from("product_images")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1);
    let nextOrder = (existingImages?.[0]?.display_order ?? -1) + 1;

    const mediaRows: { product_id: string; url: string; alt_text: string; display_order: number; media_type: string }[] = [];

    photoUrls.forEach((url) => {
      mediaRows.push({ product_id: productId, url, alt_text: parsed.data.name, display_order: nextOrder++, media_type: "imagem" });
    });
    if (videoUrl) {
      mediaRows.push({ product_id: productId, url: videoUrl, alt_text: parsed.data.name, display_order: nextOrder++, media_type: "video" });
    }
    if (mediaRows.length > 0) {
      await supabase.from("product_images").insert(mediaRows);
    }
  }

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}/editar`);
  return actionSuccess(undefined);
}

export async function deleteProductImageAction(imageId: string): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return actionError("Não foi possível remover essa mídia.");

  revalidatePath("/admin/produtos");
  return actionSuccess(undefined);
}

export async function updateProductStatusAction(productId: string, status: "ativo" | "inativo" | "rascunho"): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", productId);

  if (error) return actionError("Não foi possível atualizar o status do produto.");

  revalidatePath("/admin/produtos");
  return actionSuccess(undefined);
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    logger.error("Erro ao excluir produto", { productId, error: error.message });
    // 23503 = violação de chave estrangeira — o produto já foi vendido
    // (tem order_items apontando pra ele) e não pode ser apagado sem
    // quebrar o histórico de pedidos. Orientar a marcar como inativo.
    if (error.code === "23503") {
      return actionError(
        "Esse produto já tem pedidos vinculados a ele e não pode ser excluído (isso preservaria o histórico de vendas). Em vez disso, edite o produto e mude o status para \"Inativo\" — ele some da loja sem apagar o histórico."
      );
    }
    return actionError("Não foi possível excluir o produto.");
  }

  revalidatePath("/admin/produtos");
  return actionSuccess(undefined);
}

function flatten(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const key in flat) {
    const messages = flat[key];
    if (messages && messages[0]) result[key] = messages[0];
  }
  return result;
}
