"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { orderStatusUpdateSchema } from "@/lib/validation/admin-schemas";
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
 * Atualização manual de status pelo admin — usada, por exemplo, para
 * marcar "enviado" após despachar um produto físico. A transição
 * "aguardando_pagamento" → "pago" normalmente acontece via webhook
 * (Etapa 10), não por esta action, mas o admin pode corrigir manualmente
 * em caso de divergência.
 */
export async function updateOrderStatusAction(input: unknown): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const parsed = orderStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos para atualização de status.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.orderId);

  if (error) {
    logger.error("Erro ao atualizar status do pedido", { orderId: parsed.data.orderId, error: error.message });
    return actionError("Não foi possível atualizar o status do pedido.");
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
  return actionSuccess(undefined);
}
