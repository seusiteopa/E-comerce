import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { loyaltyTierForPaidCount } from "@/lib/loyalty/rules";
import { logger } from "@/lib/logger";

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "FIEL";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * Chamada quando um pagamento é aprovado. Conta as compras pagas do cliente nesta loja
 * (compras do próprio dono da loja não contam) e, se chegou num marco, gera o cupom de uso único.
 */
export async function grantLoyaltyReward(input: { storeId: string; profileId: string; payerEmail: string | null; storeName: string }): Promise<void> {
  const service = createSupabaseServiceClient();

  // Dono ou membro da loja não ganha fidelidade na própria loja.
  const { data: member } = await service.from("store_members").select("user_id").eq("store_id", input.storeId).eq("user_id", input.profileId).maybeSingle();
  if (member) return;

  const { count } = await service
    .from("payments")
    .select("id, orders!inner(store_id, profile_id)", { count: "exact", head: true })
    .eq("status", "aprovado")
    .eq("orders.store_id", input.storeId)
    .eq("orders.profile_id", input.profileId);
  const paidCount = count ?? 0;

  const tier = loyaltyTierForPaidCount(paidCount);
  if (!tier) return;

  const now = new Date();
  const until = new Date(now.getTime() + tier.validDays * 86_400_000);
  const code = randomCode();

  const { error: couponError } = await service.from("coupons").insert({
    store_id: input.storeId,
    code,
    discount_type: "percentual",
    discount_value: tier.discountPct,
    valid_from: now.toISOString(),
    valid_until: until.toISOString(),
    usage_limit: 1,
    usage_limit_per_customer: 1,
    active: true,
  });
  if (couponError) {
    logger.warn("Não foi possível criar cupom de fidelidade", { storeId: input.storeId, error: couponError.message });
    return;
  }

  const { error: rewardError } = await service.from("loyalty_rewards").insert({
    store_id: input.storeId,
    profile_id: input.profileId,
    paid_order_count: paidCount,
    coupon_code: code,
  });
  if (rewardError) {
    // Marco já premiado (corrida entre duas aprovações): desfaz o cupom recém-criado.
    await service.from("coupons").delete().eq("store_id", input.storeId).eq("code", code);
    return;
  }

  if (input.payerEmail) {
    await sendTransactionalEmail({
      event: "cupom_fidelidade",
      to: { email: input.payerEmail, name: "Cliente" },
      data: {
        storeName: input.storeName,
        discount: tier.discountPct,
        code,
        validUntil: until.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      },
    });
  }
}

/** Cupom de fidelidade só pode ser usado pela pessoa que ganhou. */
export async function isLoyaltyCouponForAnotherCustomer(input: { storeId: string; code: string; profileId: string | null }): Promise<boolean> {
  const service = createSupabaseServiceClient();
  const { data } = await service.from("loyalty_rewards").select("profile_id").eq("store_id", input.storeId).eq("coupon_code", input.code).maybeSingle();
  if (!data) return false;
  return data.profile_id !== input.profileId;
}
