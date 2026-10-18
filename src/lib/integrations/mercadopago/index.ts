import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import crypto from "crypto";
import { logger } from "@/lib/logger";

function getClient(accessToken?: string) {
  const token = accessToken ?? process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken: token });
}

/** Endereço que o Mercado Pago chama quando o pagamento muda. Leva a loja para o webhook usar o token certo. */
function notificationUrl(platformSiteUrl: string, storeId?: string) {
  const base = `${platformSiteUrl}/api/webhooks/mercadopago`;
  return storeId ? `${base}?store=${storeId}` : base;
}

export interface CreatePaymentPreferenceInput {
  orderId: string;
  totalAmount: number;
  description: string;
  payerEmail: string;
  payerDocument: string;
  /** Token do vendedor (OAuth). Sem ele usa o token da plataforma. */
  accessToken?: string;
  /** Comissão da plataforma em R$ (split). */
  applicationFee?: number;
  /** Id da loja — vai na URL do webhook. */
  storeId?: string;
  /** Endereço público da loja, para os links de retorno do cliente. */
  storeOrigin?: string;
}

export interface CreatePaymentPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
}

export async function createPaymentPreference(
  input: CreatePaymentPreferenceInput
): Promise<CreatePaymentPreferenceResult> {
  const client = getClient(input.accessToken);
  const preference = new Preference(client);

  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!platformUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");
  const siteUrl = input.storeOrigin ?? platformUrl;

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
        payer: {
          email: input.payerEmail,
          identification: { type: "CPF", number: input.payerDocument },
        },
        external_reference: input.orderId,
        back_urls: {
          success: `${siteUrl}/checkout/confirmacao?pedido=${input.orderId}`,
          pending: `${siteUrl}/checkout/confirmacao?pedido=${input.orderId}`,
          failure: `${siteUrl}/checkout?pedido=${input.orderId}&erro=pagamento`,
        },
        auto_return: "approved",
        notification_url: notificationUrl(platformUrl, input.storeId),
        ...(input.applicationFee && input.applicationFee > 0 ? ({ marketplace_fee: input.applicationFee } as object) : {}),
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

export interface CreatePixPaymentInput {
  orderId: string;
  totalAmount: number;
  description: string;
  payerEmail: string;
  /** Opcional (no balcão o cliente não informa CPF). */
  payerDocument?: string;
  accessToken?: string;
  applicationFee?: number;
  storeId?: string;
}

export interface CreatePixPaymentResult {
  paymentId: string;
  status: string;
  qrCodeBase64: string;
  qrCode: string;
}

export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<CreatePixPaymentResult> {
  const client = getClient(input.accessToken);
  const payment = new Payment(client);

  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!platformUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");

  try {
    const result = await payment.create({
      body: {
        transaction_amount: input.totalAmount,
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: input.payerEmail,
          ...(input.payerDocument ? { identification: { type: "CPF", number: input.payerDocument } } : {}),
        },
        external_reference: input.orderId,
        notification_url: notificationUrl(platformUrl, input.storeId),
        ...(input.applicationFee && input.applicationFee > 0 ? ({ application_fee: input.applicationFee } as object) : {}),
      },
      requestOptions: { idempotencyKey: input.orderId },
    });

    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = result.point_of_interaction?.transaction_data?.qr_code;

    if (!result.id || !qrCodeBase64 || !qrCode) {
      throw new Error("Resposta inesperada do Mercado Pago ao criar pagamento Pix.");
    }

    logger.info("Pagamento Pix criado", { orderId: input.orderId, integration: "mercadopago" });

    return {
      paymentId: String(result.id),
      status: result.status ?? "pending",
      qrCodeBase64,
      qrCode,
    };
  } catch (error) {
    logger.error("Erro ao criar pagamento Pix", {
      orderId: input.orderId,
      integration: "mercadopago",
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Não foi possível gerar o Pix. Tente novamente em instantes.");
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

export async function fetchPaymentStatus(
  paymentId: string,
  accessTokenOverride?: string
): Promise<{
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  externalReference: string | null;
}> {
  const accessToken = accessTokenOverride ?? process.env.MERCADOPAGO_ACCESS_TOKEN;
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

export interface CreateCardPaymentInput {
  orderId: string;
  totalAmount: number;
  description: string;
  payerEmail: string;
  payerDocument: string;
  cardToken: string;
  paymentMethodId: string;
  accessToken?: string;
  applicationFee?: number;
  storeId?: string;
}

/** Cobrança no cartão com token gerado no navegador, na conta Mercado Pago do lojista (accessToken). */
export async function createCardPayment(
  input: CreateCardPaymentInput
): Promise<{ paymentId: string; status: string; statusDetail: string | null }> {
  const client = getClient(input.accessToken);
  const payment = new Payment(client);
  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!platformUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");

  try {
    const result = await payment.create({
      body: {
        transaction_amount: input.totalAmount,
        description: input.description,
        token: input.cardToken,
        payment_method_id: input.paymentMethodId,
        installments: 1,
        payer: {
          email: input.payerEmail,
          identification: { type: "CPF", number: input.payerDocument },
        },
        external_reference: input.orderId,
        notification_url: notificationUrl(platformUrl, input.storeId),
        ...(input.applicationFee && input.applicationFee > 0 ? ({ application_fee: input.applicationFee } as object) : {}),
      },
      requestOptions: { idempotencyKey: `card-${input.orderId}` },
    });
    if (!result.id) throw new Error("Resposta inesperada do Mercado Pago ao cobrar o cartão.");
    logger.info("Pagamento com cartão criado", { orderId: input.orderId, status: result.status, integration: "mercadopago" });
    return { paymentId: String(result.id), status: result.status ?? "pending", statusDetail: result.status_detail ?? null };
  } catch (error) {
    logger.error("Erro ao cobrar cartão", {
      orderId: input.orderId,
      integration: "mercadopago",
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Não foi possível processar o cartão. Tente outro cartão ou pague com Pix.");
  }
}
