import "server-only";
import { MercadoPagoConfig, Preference } from "mercadopago";
import crypto from "crypto";
import { logger } from "@/lib/logger";

/**
 * Módulo de fronteira com o Mercado Pago (Etapa 2/7: uma troca futura de
 * gateway de pagamento deve alterar só este arquivo).
 *
 * Etapa 10: implementação real, usando o SDK oficial. A instância do
 * client é criada sob demanda (não no topo do módulo) para não quebrar o
 * build em ambientes onde a variável de ambiente ainda não está definida
 * (ex: preview/CI sem segredo configurado).
 */
function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

export interface CreatePaymentPreferenceInput {
  orderId: string;
  totalAmount: number;
  description: string;
  payerEmail: string;
}

export interface CreatePaymentPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
}

/**
 * Cria a "preferência de pagamento" no Mercado Pago (Etapa 4/7, fluxo 7.1,
 * passo 1-2). O `external_reference` é o nosso próprio `orderId` — é assim
 * que o webhook consegue relacionar a notificação de volta ao pedido certo.
 */
export async function createPaymentPreference(
  input: CreatePaymentPreferenceInput
): Promise<CreatePaymentPreferenceResult> {
  const client = getClient();
  const preference = new Preference(client);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.description,
            quantity: 1,
            unit_price: input.totalAmount,
            currency_id: "BRL",
          },
        ],
        payer: { email: input.payerEmail },
        external_reference: input.orderId,
        back_urls: {
          success: `${siteUrl}/checkout/confirmacao?pedido=${input.orderId}`,
          pending: `${siteUrl}/checkout/confirmacao?pedido=${input.orderId}`,
          failure: `${siteUrl}/checkout?pedido=${input.orderId}&erro=pagamento`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      },
    });

    if (!result.id || !result.init_point) {
      throw new Error("Resposta inesperada do Mercado Pago ao criar preferência.");
    }

    logger.info("Preferência de pagamento criada", { orderId: input.orderId, integration: "mercadopago" });

    return { preferenceId: result.id, checkoutUrl: result.init_point };
  } catch (error) {
    logger.error("Erro ao criar preferência de pagamento", {
      orderId: input.orderId,
      integration: "mercadopago",
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Não foi possível iniciar o pagamento. Tente novamente em instantes.");
  }
}

/**
 * Valida a assinatura do webhook do Mercado Pago (header `x-signature`),
 * seguindo o esquema HMAC-SHA256 documentado pelo Mercado Pago: a
 * assinatura é calculada sobre um "manifest" com o id do recurso, o
 * request-id e o timestamp, usando o segredo configurado no painel do
 * Mercado Pago (MERCADOPAGO_WEBHOOK_SECRET).
 *
 * Sem essa validação, qualquer requisição poderia forjar uma notificação
 * de "pagamento aprovado" (Etapa 4/7/9 — ponto de segurança não negociável).
 */
export function verifyWebhookSignature(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("MERCADOPAGO_WEBHOOK_SECRET não configurado — recusando webhook por segurança.", {
      integration: "mercadopago",
    });
    return false;
  }

  if (!params.signatureHeader || !params.requestIdHeader) return false;

  // Formato do header: "ts=1700000000,v1=<hash>"
  const parts = Object.fromEntries(
    params.signatureHeader.split(",").map((p) => {
      const [key, value] = p.split("=");
      return [key.trim(), value?.trim()];
    })
  );

  const ts = parts["ts"];
  const receivedHash = parts["v1"];
  if (!ts || !receivedHash) return false;

  const manifest = `id:${params.dataId};request-id:${params.requestIdHeader};ts:${ts};`;
  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(receivedHash));
  } catch {
    return false; // tamanhos diferentes de buffer também caem aqui, com segurança
  }
}

/** Consulta o status real de um pagamento direto na API do Mercado Pago (fonte de verdade). */
export async function fetchPaymentStatus(paymentId: string): Promise<{
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  externalReference: string | null;
}> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar pagamento ${paymentId} no Mercado Pago (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return { status: data.status, externalReference: data.external_reference ?? null };
}
