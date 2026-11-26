"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { SITE_SLUG_RE } from "@/lib/sites/entrega";
import { logger } from "@/lib/logger";

const idSchema = z.string().uuid();

async function assertOwner(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}

/**
 * Exclui uma loja inteira (produtos, pedidos, categorias, tudo), sem precisar de pedido do lojista.
 * Para evitar acidente, quem chama precisa digitar o endereço da loja. A loja da plataforma nunca é apagada.
 */
export async function deleteStoreAsPlatformAction(storeId: string, confirmSlug: string): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success) return actionError("Dados inválidos.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");

  const service = createSupabaseServiceClient();
  const { data: store } = await service.from("stores").select("id, slug, is_platform_owned").eq("id", storeId).maybeSingle();
  if (!store) return actionError("Loja não encontrada.");
  if (store.is_platform_owned) return actionError("A loja da própria plataforma não pode ser excluída.");
  if (confirmSlug.trim().toLowerCase() !== store.slug) return actionError("O endereço digitado não confere com o da loja.");

  const { error } = await service.rpc("platform_delete_store", { p_store_id: storeId });
  if (error) {
    logger.error("Erro ao excluir loja pela plataforma", { storeId, error: error.message });
    return actionError("Não foi possível excluir a loja agora.");
  }
  logger.info("Loja excluída pelo dono da plataforma", { storeId, slug: store.slug });
  revalidatePath("/plataforma");
  return actionSuccess(undefined);
}

/** Exclui um site publicado (o endereço /sites/<nome> deixa de existir). */
export async function deleteSiteDeliveryAction(slug: string): Promise<ActionResult> {
  if (!SITE_SLUG_RE.test(slug)) return actionError("Endereço inválido.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("site_deliveries").delete().eq("slug", slug);
  if (error) return actionError("Não foi possível excluir o site agora.");
  revalidatePath("/plataforma/sites");
  return actionSuccess(undefined);
}

/** Exclui um pedido de serviço (briefing). */
export async function deleteBriefAction(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return actionError("Dados inválidos.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("service_briefs").delete().eq("id", id);
  if (error) return actionError("Não foi possível excluir o pedido agora.");
  revalidatePath("/plataforma/briefings");
  return actionSuccess(undefined);
}
