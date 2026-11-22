"use server";

import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { OG_SETTING_KEY, parseImageDataUrl } from "@/lib/plataforma/og";

/** Salva a imagem de compartilhamento da página inicial da plataforma. */
export async function saveOgImageAction(dataUrl: string): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito à plataforma.");
  }
  if (!parseImageDataUrl(dataUrl)) return actionError("Use uma imagem PNG, JPG ou WEBP de até 800 KB.");
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("platform_settings")
    .upsert({ key: OG_SETTING_KEY, value: dataUrl, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return actionError("Não foi possível salvar a imagem agora.");
  return actionSuccess(undefined);
}
