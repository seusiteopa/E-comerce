"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/security/rate-limit";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { briefSchema } from "@/lib/briefing/schema";
import { logger } from "@/lib/logger";

/** Pedido de serviço (site, imagens, vídeos) feito na página inicial. Não exige conta. */
export async function createServiceBriefAction(input: unknown): Promise<ActionResult> {
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Confira os dados do pedido.");
  const d = parsed.data;

  // Campo isca preenchido = robô: finge que deu certo, sem salvar nada.
  if (d.website) return actionSuccess(undefined);

  if (!(await rateLimit("briefing", 5, 60 * 60))) return actionError(TOO_MANY_MESSAGE);

  const service = createSupabaseServiceClient();
  const { error } = await service.from("service_briefs").insert({
    kind: d.kind,
    name: d.name,
    whatsapp: d.whatsapp,
    email: d.email || null,
    business: d.business || null,
    description: d.description,
    references_text: d.references || null,
    deadline: d.deadline || null,
  });
  if (error) {
    logger.error("Erro ao salvar pedido de serviço", { error: error.message });
    return actionError("Não foi possível enviar o pedido agora. Tente novamente.");
  }
  return actionSuccess(undefined);
}
