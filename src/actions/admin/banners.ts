"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { uploadToCloudinary } from "@/lib/cloudinary";

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

/**
 * Cria um banner a partir de arquivos enviados (até 3 fotos + 1 vídeo por
 * envio, todos com a mesma posição/título/link). Cada arquivo vira uma
 * linha própria em `banners`, na sequência de display_order — permite ter
 * banner "principal" e "secundário" ativos ao mesmo tempo, cada um podendo
 * ter várias mídias que giram no carrossel da home.
 */
export async function createBannerAction(formData: FormData): Promise<ActionResult<{ count: number }>> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim() || null;
  const position = (formData.get("position") as string) || "principal";
  const active = formData.get("active") === "on";

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  const videoFile = formData.get("video");
  const video = videoFile instanceof File && videoFile.size > 0 ? videoFile : null;

  if (photos.length === 0 && !video) {
    return actionError("Envie ao menos uma foto ou um vídeo para o banner.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("banners")
    .select("display_order")
    .eq("position", position)
    .order("display_order", { ascending: false })
    .limit(1);
  let nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const rows: { image_url: string; link_url: string | null; title: string | null; position: string; active: boolean; display_order: number; media_type: string }[] = [];

  for (const photo of photos) {
    try {
      const url = await uploadToCloudinary(photo, "image", "vecorion/banners");
      rows.push({ image_url: url, link_url: linkUrl, title, position, active, display_order: nextOrder++, media_type: "imagem" });
    } catch (err) {
      logger.error("Falha ao enviar foto do banner para o Cloudinary", { error: (err as Error).message });
    }
  }

  if (video) {
    try {
      const url = await uploadToCloudinary(video, "video", "vecorion/banners");
      rows.push({ image_url: url, link_url: linkUrl, title, position, active, display_order: nextOrder++, media_type: "video" });
    } catch (err) {
      logger.error("Falha ao enviar vídeo do banner para o Cloudinary", { error: (err as Error).message });
    }
  }

  if (rows.length === 0) {
    return actionError("Não foi possível enviar nenhuma mídia do banner. Tente novamente.");
  }

  const { error } = await supabase.from("banners").insert(rows);

  if (error) {
    logger.error("Erro ao criar banner", { error: error.message });
    return actionError("Não foi possível salvar o banner.");
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return actionSuccess({ count: rows.length });
}

export async function toggleBannerActiveAction(id: string, active: boolean): Promise<ActionResult<null>> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("banners").update({ active }).eq("id", id);

  if (error) {
    return actionError("Não foi possível atualizar o banner.");
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return actionSuccess(null);
}

export async function deleteBannerAction(id: string): Promise<ActionResult<null>> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);

  if (error) {
    return actionError("Não foi possível excluir o banner.");
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return actionSuccess(null);
}
