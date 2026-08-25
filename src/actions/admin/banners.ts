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

export async function createBannerAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim() || null;
  const position = (formData.get("position") as string) || "principal";
  const active = formData.get("active") === "on";

  if (!imageUrl) {
    return actionError("Informe a imagem do banner.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("banners")
    .insert({ image_url: imageUrl, link_url: linkUrl, title, position, active })
    .select("id")
    .single();

  if (error) {
    logger.error("Erro ao criar banner", { error: error.message });
    return actionError("Não foi possível salvar o banner.");
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return actionSuccess({ id: data.id });
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
