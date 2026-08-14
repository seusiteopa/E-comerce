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

/**
 * Libera manualmente o acesso a um curso (fila "Cursos Pendentes" —
 * Etapa 4/5). Nesta fase não há chamada de API para a Vecorion Cursos
 * (que ainda não tem backend/autenticação própria — Etapa 1/4); o admin
 * confirma que já liberou o acesso por fora, e este registro marca o
 * item como resolvido na fila.
 *
 * Lacuna da Etapa 9 corrigida na migration 005 (colunas
 * `course_access_released` / `course_access_released_at` em order_items).
 */
export async function markCourseAccessReleasedAction(orderItemId: string): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("order_items")
    .update({ course_access_released: true, course_access_released_at: new Date().toISOString() })
    .eq("id", orderItemId);

  if (error) {
    logger.error("Erro ao marcar liberação de curso", { orderItemId, error: error.message });
    return actionError("Não foi possível registrar a liberação do curso.");
  }

  revalidatePath("/admin/cursos-pendentes");
  logger.info("Acesso a curso marcado como liberado manualmente", { orderItemId });
  return actionSuccess(undefined);
}
