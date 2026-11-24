"use server";

import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { BRIEF_STATUS, type BriefStatus } from "@/lib/briefing/schema";

/** Muda a situação de um pedido de serviço. Só a plataforma faz isso. */
export async function updateBriefStatusAction(id: string, status: BriefStatus): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito à plataforma.");
  }
  if (!BRIEF_STATUS.includes(status)) return actionError("Situação inválida.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("service_briefs").update({ status }).eq("id", id);
  if (error) return actionError("Não foi possível atualizar agora.");
  return actionSuccess(undefined);
}
