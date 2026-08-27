"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

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
 * Cria um banner a partir de mídias já enviadas pro Cloudinary pelo
 * navegador (até 3 fotos + 1 vídeo por envio, todos com a mesma
 * posição/título/link). Cada mídia vira uma linha própria em `banners`,
 * na sequência de display_order — permite ter banner "principal" e
 * "secundário" ativos ao mesmo tempo, cada um podendo ter várias mídias
 * que giram no carrossel da home.
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

  const photoUrls = formData.getAll("photoUrls").filter((v): v is string => typeof v === "string" && v.length > 0).slice(0, 3);
  const videoUrl = formData.get("videoUrl") as string | null;

  if (photoUrls.length === 0 && !videoUrl) {
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

  photoUrls.forEach((url) => {
    rows.push({ image_url: url, link_url: linkUrl, title, position, active, display_order: nextOrder++, media_type: "imagem" });
  });

  if (videoUrl) {
    rows.push({ image_url: videoUrl, link_url: linkUrl, title, position, active, display_order: nextOrder++, media_type: "video" });
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
