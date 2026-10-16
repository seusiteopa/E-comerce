import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { logger } from "@/lib/logger";
import { fetchAuthorizedPayment, fetchPreapproval } from "./subscription";

/**
 * Sincroniza a mensalidade da loja com o que o Mercado Pago informa (sempre consultando a API,
 * nunca confiando só no aviso). IMPORTANTE: atraso NÃO pausa a loja — só avisa o lojista e
 * marca "atrasada". Pausar é decisão manual do dono da plataforma.
 */

async function notifyOwner(storeId: string, event: "mensalidade_atrasada" | "mensalidade_confirmada") {
  try {
    const supabase = createSupabaseServiceClient();
    const { data: store } = await supabase.from("stores").select("name, owner_id").eq("id", storeId).maybeSingle();
    const { data: billing } = await supabase.from("store_billing").select("payer_email").eq("store_id", storeId).maybeSingle();
    if (!store) return;

    let email = billing?.payer_email ?? null;
    if (!email && store.owner_id) {
      const { data } = await supabase.auth.admin.getUserById(store.owner_id);
      email = data.user?.email ?? null;
    }
    if (!email) return;

    await sendTransactionalEmail({ event, to: { email, name: store.name }, data: { storeName: store.name } });
    await supabase.from("store_billing").update({ last_notice_at: new Date().toISOString() }).eq("store_id", storeId);
  } catch (error) {
    logger.warn("Não foi possível enviar o aviso de mensalidade", {
      storeId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function syncPreapproval(preapprovalId: string): Promise<void> {
  const pre = await fetchPreapproval(preapprovalId);
  if (!pre.externalReference) {
    logger.warn("Assinatura sem external_reference — ignorada", { preapprovalId });
    return;
  }
  const supabase = createSupabaseServiceClient();
  const storeId = pre.externalReference;

  const { data: billing } = await supabase.from("store_billing").select("mp_preapproval_id, subscription_status").eq("store_id", storeId).maybeSingle();
  if (!billing) {
    logger.warn("Assinatura de loja inexistente — ignorada", { preapprovalId, storeId });
    return;
  }
  // Só aceita a assinatura registrada para esta loja (evita que outra assinatura sobrescreva a atual).
  if (billing.mp_preapproval_id && billing.mp_preapproval_id !== pre.id) return;

  const patch: Record<string, unknown> = {
    mp_preapproval_id: pre.id,
    next_due_at: pre.nextPaymentDate,
    updated_at: new Date().toISOString(),
  };
  if (pre.payerEmail) patch.payer_email = pre.payerEmail;

  if (pre.status === "authorized") {
    // Autorizou no banco: começa o mês grátis (ou continua ativa, se já tinha pago).
    patch.subscription_status = billing.subscription_status === "ativa" ? "ativa" : "em_teste";
    if (billing.subscription_status !== "ativa") patch.trial_ends_at = pre.nextPaymentDate;
  } else if (pre.status === "paused") {
    patch.subscription_status = "pausada";
  } else if (pre.status === "cancelled") {
    patch.subscription_status = "cancelada";
  } else {
    patch.subscription_status = "pendente";
  }

  await supabase.from("store_billing").update(patch).eq("store_id", storeId);
  logger.info("Assinatura sincronizada", { storeId, status: pre.status, integration: "mercadopago" });
}

export async function syncAuthorizedPayment(authorizedPaymentId: string): Promise<void> {
  const payment = await fetchAuthorizedPayment(authorizedPaymentId);
  if (!payment.preapprovalId) return;

  const pre = await fetchPreapproval(payment.preapprovalId);
  if (!pre.externalReference) return;
  const storeId = pre.externalReference;
  const supabase = createSupabaseServiceClient();

  const { data: billing } = await supabase.from("store_billing").select("mp_preapproval_id").eq("store_id", storeId).maybeSingle();
  if (!billing || (billing.mp_preapproval_id && billing.mp_preapproval_id !== pre.id)) return;

  if (payment.paymentStatus === "approved") {
    await supabase
      .from("store_billing")
      .update({
        subscription_status: "ativa",
        billing_status: "em_dia",
        last_payment_at: new Date().toISOString(),
        next_due_at: pre.nextPaymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId);
    await notifyOwner(storeId, "mensalidade_confirmada");
  } else if (payment.paymentStatus === "rejected" || payment.status === "recycling") {
    await supabase
      .from("store_billing")
      .update({ billing_status: "atrasada", next_due_at: pre.nextPaymentDate, updated_at: new Date().toISOString() })
      .eq("store_id", storeId);
    await notifyOwner(storeId, "mensalidade_atrasada");
  }
}
