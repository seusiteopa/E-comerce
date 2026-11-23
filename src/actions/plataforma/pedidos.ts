"use server";

import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

async function assertAdmin(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}

/** Aprovar exclusão: só apaga a loja se ela não tiver pedidos. Com pedidos, a opção é encerrar. */
export async function aprovarExclusaoAction(requestId: string): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const service = createSupabaseServiceClient();
  const { data: req } = await service.from("store_requests").select("id, store_id, kind, status").eq("id", requestId).maybeSingle();
  if (!req || req.kind !== "exclusao" || req.status !== "pendente") return actionError("Pedido não encontrado ou já analisado.");

  const { count } = await service.from("orders").select("id", { count: "exact", head: true }).eq("store_id", req.store_id);
  if ((count ?? 0) > 0) {
    return actionError("Esta loja tem pedidos. Sugira encerrar em vez de excluir.");
  }

  await service.from("store_requests").update({ status: "concluida", resolved_at: new Date().toISOString() }).eq("id", requestId);
  await service.from("stores").delete().eq("id", req.store_id);
  logger.info("Loja excluída após aprovação da plataforma", { storeId: req.store_id });
  return actionSuccess(undefined);
}

/** Recusar pedido: a loja continua como está. */
export async function recusarPedidoAction(requestId: string): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("store_requests")
    .update({ status: "recusada", resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pendente");
  if (error) return actionError("Não foi possível recusar o pedido.");
  return actionSuccess(undefined);
}

/** Reativar uma loja encerrada pela plataforma. */
export async function reativarLojaPlataformaAction(storeId: string): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("stores").update({ status: "ativa" }).eq("id", storeId);
  if (error) return actionError("Não foi possível reativar a loja.");
  return actionSuccess(undefined);
}
