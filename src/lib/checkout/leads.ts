import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { logger } from "@/lib/logger";

export const LEAD_DELAY_MINUTES = 60;

export type LeadCartItem = { name: string; quantity: number; unitPrice: number };

/** Guarda o carrinho de quem chegou ao pagamento. Não envia nada agora. */
export async function registerCheckoutLead(input: { storeId: string; email: string; cart: LeadCartItem[] }): Promise<void> {
  if (input.cart.length === 0) return;
  const service = createSupabaseServiceClient();
  const { error } = await service.from("checkout_leads").upsert(
    {
      store_id: input.storeId,
      email: input.email.trim().toLowerCase(),
      cart: input.cart,
      status: "pendente",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id,email" }
  );
  if (error) logger.warn("Não foi possível registrar o carrinho para recuperação", { storeId: input.storeId, error: error.message });
}

/** Compra concluída: o registro deixa de ser elegível para lembrete. */
export async function markCheckoutLeadPaid(input: { storeId: string; email: string }): Promise<void> {
  const service = createSupabaseServiceClient();
  await service
    .from("checkout_leads")
    .update({ status: "concluido", updated_at: new Date().toISOString() })
    .eq("store_id", input.storeId)
    .eq("email", input.email.trim().toLowerCase());
}

/** Lembretes para carrinhos parados há pelo menos 1 hora, uma única vez por pessoa e loja. */
export async function sendAbandonedCartReminders(): Promise<{ sent: number }> {
  const service = createSupabaseServiceClient();
  const cutoff = new Date(Date.now() - LEAD_DELAY_MINUTES * 60_000).toISOString();
  const { data: leads } = await service
    .from("checkout_leads")
    .select("id, email, cart, stores(slug, name, is_platform_owned)")
    .eq("status", "pendente")
    .is("reminder_sent_at", null)
    .lt("updated_at", cutoff)
    .limit(200);

  let sent = 0;
  for (const lead of leads ?? []) {
    const store = lead.stores as unknown as { slug: string; name: string; is_platform_owned: boolean } | null;
    const cart = (lead.cart ?? []) as LeadCartItem[];
    if (!store || cart.length === 0) continue;

    const base = store.is_platform_owned ? "" : `/lojas/${store.slug}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    try {
      await sendTransactionalEmail({
        event: "recuperar_carrinho",
        to: { email: lead.email, name: "Cliente" },
        data: {
          storeName: store.name,
          items: cart.map((i) => `${i.quantity}× ${i.name}`).join(", "),
          total: total.toFixed(2).replace(".", ","),
          link: `${siteUrl}${base}/checkout`,
        },
      });
      await service.from("checkout_leads").update({ status: "lembrado", reminder_sent_at: new Date().toISOString() }).eq("id", lead.id);
      sent++;
    } catch (error) {
      logger.warn("Falha ao enviar lembrete de carrinho", { leadId: lead.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { sent };
}
