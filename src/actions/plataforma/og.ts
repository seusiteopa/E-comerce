"use server";

import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { LOGO_SETTING_KEY, OG_SETTING_KEY, parseImageDataUrl } from "@/lib/plataforma/og";

async function saveImageSetting(key: string, dataUrl: string): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito à plataforma.");
  }
  if (!parseImageDataUrl(dataUrl)) return actionError("Use uma imagem PNG, JPG ou WEBP de até 800 KB.");
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("platform_settings")
    .upsert({ key, value: dataUrl, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return actionError("Não foi possível salvar a imagem agora.");
  return actionSuccess(undefined);
}

/** Salva a imagem de compartilhamento da página inicial da plataforma. */
export async function saveOgImageAction(dataUrl: string): Promise<ActionResult> {
  return saveImageSetting(OG_SETTING_KEY, dataUrl);
}

/** Salva a logo da plataforma (cabeçalho e rodapé da página inicial). */
export async function saveLogoAction(dataUrl: string): Promise<ActionResult> {
  return saveImageSetting(LOGO_SETTING_KEY, dataUrl);
}
