import "server-only";
import { logger } from "@/lib/logger";

/**
 * Mensalidade recorrente da loja, cobrada na conta Mercado Pago da PLATAFORMA (token da Vecorion,
 * nunca o do lojista). Usa a API de Assinaturas (/preapproval):
 *  - 1º mês grátis (free_trial); o lojista é levado ao Mercado Pago para autorizar as cobranças seguintes;
 *  - o mês conta a partir do dia em que a assinatura é autorizada (criação da loja);
 *  - depois cobra todo mês, automaticamente, no meio de pagamento autorizado.
 */

function platformToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export function monthlyFeeFromEnv(): number | null {
  const raw = process.env.PLATFORM_MONTHLY_FEE;
  if (!raw) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export interface CreateSubscriptionInput {
  storeId: string;
  storeName: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
}

export interface CreateSubscriptionResult {
  preapprovalId: string;
  authorizationUrl: string;
  nextPaymentDate: string | null;
}

export async function createStoreSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${platformToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `sub-${input.storeId}-${Math.floor(Date.now() / 60000)}`,
    },
    body: JSON.stringify({
      reason: `Mensalidade Vecorion — ${input.storeName}`,
      external_reference: input.storeId,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: "BRL",
        free_trial: { frequency: 1, frequency_type: "months" },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("Falha ao criar assinatura da mensalidade", {
      storeId: input.storeId,
      integration: "mercadopago",
      status: response.status,
      body: text.slice(0, 300),
    });
    throw new Error("Não foi possível iniciar a assinatura da mensalidade agora. Tente novamente em instantes.");
  }

  const data = await response.json();
  if (!data.id || !data.init_point) throw new Error("Resposta inesperada do Mercado Pago ao criar a assinatura.");
  return { preapprovalId: String(data.id), authorizationUrl: data.init_point, nextPaymentDate: data.next_payment_date ?? null };
}

export interface PreapprovalState {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  externalReference: string | null;
  nextPaymentDate: string | null;
  payerEmail: string | null;
}

export async function fetchPreapproval(id: string): Promise<PreapprovalState> {
  const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${platformToken()}` },
  });
  if (!response.ok) throw new Error(`Falha ao consultar assinatura ${id} (HTTP ${response.status}).`);
  const data = await response.json();
  return {
    id: String(data.id),
    status: data.status,
    externalReference: data.external_reference ?? null,
    nextPaymentDate: data.next_payment_date ?? null,
    payerEmail: data.payer_email ?? null,
  };
}

export interface AuthorizedPaymentState {
  id: string;
  preapprovalId: string | null;
  status: string; // scheduled | processed | recycling | cancelled
  paymentStatus: string | null; // approved | rejected | ...
}

export async function fetchAuthorizedPayment(id: string): Promise<AuthorizedPaymentState> {
  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, {
    headers: { Authorization: `Bearer ${platformToken()}` },
  });
  if (!response.ok) throw new Error(`Falha ao consultar cobrança ${id} (HTTP ${response.status}).`);
  const data = await response.json();
  return {
    id: String(data.id),
    preapprovalId: data.preapproval_id ? String(data.preapproval_id) : null,
    status: data.status,
    paymentStatus: data.payment?.status ?? null,
  };
}

export async function cancelPreapproval(id: string): Promise<void> {
  const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${platformToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!response.ok) throw new Error(`Falha ao cancelar assinatura ${id} (HTTP ${response.status}).`);
}
