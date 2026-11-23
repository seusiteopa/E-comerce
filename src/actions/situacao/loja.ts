"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

/** Encerrar: o próprio dono faz; a plataforma é avisada no painel. Os dados ficam guardados. */
export async function encerrarLojaAction(): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const service = createSupabaseServiceClient();
  const { error } = await service.from("stores").update({ status: "encerrada" }).eq("id", store.id);
  if (error) return actionError("Não foi possível encerrar a loja agora.");
  await service.from("store_requests").insert({ store_id: store.id, kind: "encerrada", status: "concluida", note: "Loja encerrada pelo dono." });
  logger.info("Loja encerrada pelo dono", { storeId: store.id });
  return actionSuccess(undefined);
}

/** Reativar: o dono volta a vender quando quiser. */
export async function reativarLojaAction(): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const service = createSupabaseServiceClient();
  const { error } = await service.from("stores").update({ status: "ativa" }).eq("id", store.id);
  if (error) return actionError("Não foi possível reativar a loja agora.");
  return actionSuccess(undefined);
}

/** Pedido de exclusão: só acontece depois da aprovação da plataforma. */
export async function solicitarExclusaoAction(input: unknown): Promise<ActionResult> {
  let store;
  let profile;
  try {
    ({ store, profile } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const parsed = z.object({ note: z.string().trim().max(300).optional().default("") }).safeParse(input);
  if (!parsed.success) return actionError("Confira o motivo informado.");
  const service = createSupabaseServiceClient();
  const { data: pending } = await service
    .from("store_requests")
    .select("id")
    .eq("store_id", store.id)
    .eq("kind", "exclusao")
    .eq("status", "pendente")
    .maybeSingle();
  if (pending) return actionError("Já existe um pedido de exclusão aguardando análise.");
  const { error } = await service.from("store_requests").insert({
    store_id: store.id,
    requested_by: profile.id,
    kind: "exclusao",
    status: "pendente",
    note: parsed.data.note || null,
  });
  if (error) return actionError("Não foi possível enviar o pedido agora.");
  return actionSuccess(undefined);
}
