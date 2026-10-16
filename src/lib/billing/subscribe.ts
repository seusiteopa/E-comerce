import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createStoreSubscription, monthlyFeeFromEnv } from "@/lib/integrations/mercadopago/subscription";

/**
 * Cria a assinatura recorrente da loja e devolve o endereço onde o lojista autoriza no banco/Mercado Pago.
 * Primeiro mês grátis; o mês conta a partir da autorização (dia em que a loja é criada e assinada).
 */
export async function startSubscriptionForStore(params: {
  storeId: string;
  storeName: string;
  payerEmail: string;
  returnUrl: string;
}): Promise<{ authorizationUrl: string }> {
  const supabase = createSupabaseServiceClient();
  const { data: billing } = await supabase.from("store_billing").select("monthly_fee_cents").eq("store_id", params.storeId).maybeSingle();

  const amount = billing?.monthly_fee_cents ? billing.monthly_fee_cents / 100 : monthlyFeeFromEnv();
  if (!amount) throw new Error("Valor da mensalidade não configurado (PLATFORM_MONTHLY_FEE).");

  const subscription = await createStoreSubscription({
    storeId: params.storeId,
    storeName: params.storeName,
    payerEmail: params.payerEmail,
    amount,
    backUrl: params.returnUrl,
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await supabase
    .from("store_billing")
    .update({
      plan: "mensalidade",
      monthly_fee_cents: Math.round(amount * 100),
      mp_preapproval_id: subscription.preapprovalId,
      subscription_status: "pendente",
      payer_email: params.payerEmail,
      next_due_at: subscription.nextPaymentDate ?? nextMonth.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", params.storeId);

  return { authorizationUrl: subscription.authorizationUrl };
}
