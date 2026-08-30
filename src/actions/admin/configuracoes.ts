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
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) throw error;
    throw new ForbiddenError();
  }
}

/**
 * Salva um lote de configurações do site (logo, nome, frases da faixa
 * institucional, etc) na tabela `site_settings` (key/value). Usado pela
 * tela /admin/configuracoes.
 */
export async function updateSiteSettingsAction(settings: Record<string, string>): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });

  if (error) {
    logger.error("Erro ao salvar configurações do site", { error: error.message });
    return actionError("Não foi possível salvar as configurações.");
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}
