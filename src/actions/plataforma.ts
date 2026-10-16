"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const idSchema = z.string().uuid();

/**
 * Pausar/liberar loja — SEMPRE decisão manual do dono da plataforma. Atraso de mensalidade nunca
 * pausa sozinho: a loja segue vendendo, o sistema só avisa.
 */
export async function setStoreStatusAction(storeId: string, status: "ativa" | "pausada"): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success || (status !== "ativa" && status !== "pausada")) return actionError("Dados inválidos.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }

  const service = createSupabaseServiceClient();
  const { data: store } = await service.from("stores").select("is_platform_owned").eq("id", storeId).maybeSingle();
  if (!store) return actionError("Loja não encontrada.");
  if (store.is_platform_owned && status === "pausada") return actionError("A loja da própria plataforma não pode ser pausada.");

  const { error } = await service.from("stores").update({ status, updated_at: new Date().toISOString() }).eq("id", storeId);
  if (error) {
    logger.error("Erro ao alterar status da loja", { storeId, error: error.message });
    return actionError("Não foi possível alterar agora.");
  }
  revalidatePath("/plataforma");
  return actionSuccess(undefined);
}

/** Marca manualmente a situação da mensalidade (ex.: lojista pagou por fora). */
export async function setBillingStatusAction(storeId: string, billingStatus: "em_dia" | "atrasada"): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success || (billingStatus !== "em_dia" && billingStatus !== "atrasada")) return actionError("Dados inválidos.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("store_billing")
    .update({ billing_status: billingStatus, updated_at: new Date().toISOString() })
    .eq("store_id", storeId);
  if (error) return actionError("Não foi possível alterar agora.");
  revalidatePath("/plataforma");
  return actionSuccess(undefined);
}
