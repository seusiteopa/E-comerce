import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createPixPayment } from "@/lib/integrations/mercadopago";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { logger } from "@/lib/logger";
import { addMonths, daysBetween, discountedAmountCents } from "@/lib/billing/invoices";

const REFERENCE_PREFIX = "fatura:";
const CREATE_DAYS_BEFORE = 5;
const REMINDER_DAYS_BEFORE = 3;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cria a cobrança do próximo mês quando faltam poucos dias e ainda não existe uma aberta. */
export async function ensureUpcomingInvoice(storeId: string): Promise<string | null> {
  const service = createSupabaseServiceClient();
  const { data: billing } = await service.from("store_billing").select("monthly_fee_cents, subscription_status, referral_discount_pct").eq("store_id", storeId).maybeSingle();
  if (!billing || billing.subscription_status === "pendente") return null;

  const { data: invoices } = await service.from("billing_invoices").select("id, status, due_date, period_start").eq("store_id", storeId).order("due_date", { ascending: false });
  if ((invoices ?? []).some((i) => i.status === "aberta")) return null;

  const last = invoices?.[0];
  // Primeira cobrança: o mês seguinte ao início da loja (o primeiro mês é grátis).
  const dueDate = last ? addMonths(last.due_date, 1) : addMonths(todayIso(), 1);
  if (daysBetween(todayIso(), dueDate) > CREATE_DAYS_BEFORE) return null;

  const periodStart = last ? addMonths(last.period_start, 1) : todayIso();
  const { data: created, error } = await service
    .from("billing_invoices")
    .insert({
      store_id: storeId,
      period_start: periodStart,
      due_date: dueDate,
      // Desconto de indicação entra no valor desta cobrança, uma única vez.
      amount_cents: discountedAmountCents(billing.monthly_fee_cents ?? 9000, billing.referral_discount_pct ?? 0),
    })
    .select("id")
    .single();
  if (error) {
    logger.warn("Não foi possível criar a cobrança do mês", { storeId, error: error.message });
    return null;
  }
  // Desconto consumido: zera para não aplicar de novo na próxima cobrança.
  if ((billing.referral_discount_pct ?? 0) > 0) {
    await service.from("store_billing").update({ referral_discount_pct: 0 }).eq("store_id", storeId);
  }
  return created.id;
}

/** Gera o Pix da cobrança com a conta da plataforma (a mensalidade é da Vecorion). */
export async function ensureInvoicePix(invoiceId: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { data: invoice } = await service.from("billing_invoices").select("id, store_id, amount_cents, status, pix_payment_id").eq("id", invoiceId).maybeSingle();
  if (!invoice || invoice.status !== "aberta" || invoice.pix_payment_id) return;

  const ownerEmail = await ownerEmailOf(invoice.store_id);
  if (!ownerEmail) return;
  try {
    const pix = await createPixPayment({
      orderId: `${REFERENCE_PREFIX}${invoice.id}`,
      totalAmount: invoice.amount_cents / 100,
      description: "Mensalidade Vecorion",
      payerEmail: ownerEmail,
    });
    await service.from("billing_invoices").update({ pix_payment_id: pix.paymentId, pix_qr_code: pix.qrCode }).eq("id", invoice.id);
  } catch (error) {
    logger.error("Falha ao gerar Pix da mensalidade", { invoiceId, error: error instanceof Error ? error.message : String(error) });
  }
}

/** Lembrete por e-mail 3 dias antes do vencimento (uma vez por cobrança). */
export async function sendDueReminder(invoiceId: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { data: invoice } = await service.from("billing_invoices").select("id, store_id, due_date, amount_cents, status, reminder_sent_at").eq("id", invoiceId).maybeSingle();
  if (!invoice || invoice.status !== "aberta" || invoice.reminder_sent_at) return;
  if (daysBetween(todayIso(), invoice.due_date) > REMINDER_DAYS_BEFORE) return;

  const email = await ownerEmailOf(invoice.store_id);
  if (!email) return;
  await sendTransactionalEmail({
    event: "lembrete_mensalidade",
    to: { email, name: "Lojista" },
    data: {
      amount: (invoice.amount_cents / 100).toFixed(2).replace(".", ","),
      dueDate: new Date(`${invoice.due_date}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    },
  });
  await service.from("billing_invoices").update({ reminder_sent_at: new Date().toISOString() }).eq("id", invoice.id);
}

/** Aplica o status vindo do Mercado Pago na cobrança mensal. */
export async function applyInvoicePayment(externalReference: string, status: "aprovado" | "recusado" | "pendente" | "cancelado" | "reembolsado"): Promise<void> {
  if (!externalReference.startsWith(REFERENCE_PREFIX)) return;
  const invoiceId = externalReference.slice(REFERENCE_PREFIX.length);
  if (status !== "aprovado") return;
  const service = createSupabaseServiceClient();
  await service.from("billing_invoices").update({ status: "paga", paid_at: new Date().toISOString() }).eq("id", invoiceId).eq("status", "aberta");
}

/** Rotina diária: cria cobranças, gera Pix e envia lembretes para todas as lojas de clientes. */
export async function runBillingRoutine(): Promise<{ stores: number; created: number }> {
  const service = createSupabaseServiceClient();
  const { data: stores } = await service.from("stores").select("id").eq("is_platform_owned", false);
  let created = 0;
  for (const store of stores ?? []) {
    const invoiceId = await ensureUpcomingInvoice(store.id);
    if (invoiceId) created++;
    const { data: open } = await service.from("billing_invoices").select("id").eq("store_id", store.id).eq("status", "aberta");
    for (const inv of open ?? []) {
      await ensureInvoicePix(inv.id);
      await sendDueReminder(inv.id);
    }
  }
  return { stores: stores?.length ?? 0, created };
}

async function ownerEmailOf(storeId: string): Promise<string | null> {
  const service = createSupabaseServiceClient();
  const { data: member } = await service.from("store_members").select("user_id").eq("store_id", storeId).eq("role", "dono").maybeSingle();
  if (!member) return null;
  const { data } = await service.auth.admin.getUserById(member.user_id);
  return data.user?.email ?? null;
}
