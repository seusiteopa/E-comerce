import "server-only";
import { MercadoPagoConfig, Preference } from "mercadopago";
import crypto from "crypto";
import { logger } from "@/lib/logger";

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

  if (!params.signatureHeader) return false;

  const parts = Object.fromEntries(
    params.signatureHeader.split(",").map((p) => {
      const [key, value] = p.split("=");
      return [key.trim(), value?.trim()];
    })
  );

  const ts = parts["ts"];
  const receivedHash = parts["v1"];
  if (!ts || !receivedHash) return false;

  const manifestParts = [`id:${params.dataId}`];
  if (params.requestIdHeader) manifestParts.push(`request-id:${params.requestIdHeader}`);
  manifestParts.push(`ts:${ts}`);
  const manifest = manifestParts.join(";") + ";";

  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(receivedHash));
  } catch {
    return false;
  }
}

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
