"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStoreAdmin } from "@/lib/auth";
import { startSubscriptionForStore } from "@/lib/billing/subscribe";
import { createCardSubscription, monthlyFeeFromEnv } from "@/lib/integrations/mercadopago/subscription";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { markReferralApplied } from "@/lib/store/referral";
import { revalidatePath } from "next/cache";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { storeOrigin } from "@/lib/store/urls";
import { storeBasePath } from "@/lib/store/base-path";
import { logger } from "@/lib/logger";

/** Botão "Autorizar mensalidade" do painel: leva o lojista ao Mercado Pago para autorizar as cobranças mensais. */
export async function startSubscriptionAction(): Promise<void> {
  const { store } = await requireStoreAdmin();
  const base = await storeBasePath();
  if (store.is_platform_owned) redirect(`${base}/admin/pagamentos`);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect(`${base}/admin/pagamentos?erro=assinatura`);

  let url: string;
  try {
    const origin = await storeOrigin(store);
    const result = await startSubscriptionForStore({
      storeId: store.id,
      storeName: store.name,
      payerEmail: user.email,
      returnUrl: `${origin}/admin/pagamentos?assinatura=1`,
    });
    url = result.authorizationUrl;
  } catch (error) {
    logger.error("Falha ao iniciar assinatura pelo painel", {
      storeId: store.id,
      error: error instanceof Error ? error.message : String(error),
    });
    redirect(`${base}/admin/pagamentos?erro=assinatura`);
  }
  redirect(url);
}

/** Autoriza a mensalidade com o cartão digitado na própria Vecorion (sem sair do site). */
export async function authorizeCardSubscriptionAction(input: { cardToken: string }): Promise<ActionResult> {
  if (!input?.cardToken || typeof input.cardToken !== "string") return actionError("Token do cartão inválido.");

  let store;
  let userEmail: string | undefined;
  try {
    ({ store } = await requireStoreAdmin());
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? undefined;
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  if (store.is_platform_owned) return actionError("A conta principal não tem mensalidade.");
  if (!userEmail) return actionError("Não foi possível identificar seu e-mail.");

  const service = createSupabaseServiceClient();
  const { data: billing } = await service.from("store_billing").select("monthly_fee_cents").eq("store_id", store.id).maybeSingle();
  const amount = billing?.monthly_fee_cents ? billing.monthly_fee_cents / 100 : monthlyFeeFromEnv();
  if (!amount) return actionError("Valor da mensalidade não configurado.");

  try {
    const sub = await createCardSubscription({
      storeId: store.id,
      storeName: store.name,
      payerEmail: userEmail,
      amount,
      cardTokenId: input.cardToken,
    });
    const authorized = sub.status === "authorized";
    const { error } = await service
      .from("store_billing")
      .update({
        plan: "mensalidade",
        monthly_fee_cents: Math.round(amount * 100),
        mp_preapproval_id: sub.preapprovalId,
        subscription_status: authorized ? "em_teste" : "pendente",
        payer_email: userEmail,
        next_due_at: sub.nextPaymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", store.id);
    if (error) {
      logger.error("Erro ao salvar assinatura do cartão", { storeId: store.id, error: error.message });
      return actionError("Cartão autorizado, mas não foi possível salvar. Fale com o suporte.");
    }
    if (authorized) await markReferralApplied(store.id).catch(() => undefined);
    revalidatePath("/admin/pagamentos");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Não foi possível autorizar o cartão.");
  }
}
