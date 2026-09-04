"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { categoryAdminSchema } from "@/lib/validation/admin-schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

async function guardAdmin() {
  try {
    return await requireAdminProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) throw error;
    throw new ForbiddenError();
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const name = (formData.get("name") as string)?.trim() ?? "";
  const parsed = categoryAdminSchema.safeParse({
    slug: slugify(name),
    name,
    description: (formData.get("description") as string)?.trim() || undefined,
    productType: formData.get("productType") as string,
  });

  if (!parsed.success) {
    return actionError("Verifique os campos da categoria.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    product_type: parsed.data.productType,
    active: true,
  });

  if (error) {
    logger.error("Erro ao criar categoria", { error: error.message });
    if (error.code === "23505") {
      return actionError("Já existe uma categoria com esse nome.");
    }
    return actionError("Não foi possível criar a categoria.");
  }

  revalidatePath("/admin/categorias");
  return actionSuccess(undefined);
}

export async function deleteCategoryAction(slug: string): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("slug", slug);

  if (error) {
    logger.error("Erro ao excluir categoria", { slug, error: error.message });
    // 23503 = violação de chave estrangeira — tem produto usando essa categoria.
    if (error.code === "23503") {
      return actionError("Essa categoria ainda tem produto(s) vinculado(s). Edite os produtos e troque a categoria deles antes de excluir.");
    }
    return actionError("Não foi possível excluir a categoria.");
  }

  revalidatePath("/admin/categorias");
  return actionSuccess(undefined);
}

export async function toggleCategoryActiveAction(slug: string, active: boolean): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").update({ active }).eq("slug", slug);

  if (error) return actionError("Não foi possível atualizar a categoria.");

  revalidatePath("/admin/categorias");
  return actionSuccess(undefined);
}
