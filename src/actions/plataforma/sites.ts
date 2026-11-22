"use server";

import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { validateSiteDelivery } from "@/lib/sites/entrega";
import { logger } from "@/lib/logger";

/** Publica (ou atualiza) o site de um pedido. Só a plataforma faz isso. */
export async function saveSiteDeliveryAction(input: { orderId: string; slug: string; html: string }): Promise<ActionResult<{ url: string }>> {
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito à plataforma.");
  }
  const slug = input.slug.trim().toLowerCase();
  const error = validateSiteDelivery(slug, input.html);
  if (error) return actionError(error);

  const service = createSupabaseServiceClient();
  const { data: order } = await service.from("orders").select("id").eq("id", input.orderId).maybeSingle();
  if (!order) return actionError("Pedido não encontrado.");

  const { data: current } = await service.from("site_deliveries").select("id, order_id").eq("slug", slug).maybeSingle();
  if (current && current.order_id !== input.orderId) return actionError("Este endereço já está em uso por outro site.");

  const { error: saveError } = await service
    .from("site_deliveries")
    .upsert({ slug, order_id: input.orderId, html: input.html, updated_at: new Date().toISOString() }, { onConflict: "slug" });
  if (saveError) return actionError("Não foi possível publicar o site agora.");

  logger.info("Site publicado", { slug, orderId: input.orderId });
  return actionSuccess({ url: `/sites/${slug}` });
}
