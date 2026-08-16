import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, fetchPaymentStatus } from "@/lib/integrations/mercadopago";
import { applyPaymentStatusUpdate } from "@/lib/integrations/mercadopago/apply-payment-update";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { PaymentStatus } from "@/types";

/**
 * Endpoint que o Mercado Pago chama de forma assíncrona quando o status
 * de um pagamento muda (Etapa 4/7, fluxo 7.1, passo 3). Configurado como
 * `notification_url` na criação da preferência (lib/integrations/mercadopago).
 *
 * Fluxo de processamento:
 *  1. Extrai o id do pagamento notificado
 *  2. Valida a assinatura do webhook (recusa se inválida — Etapa 4/7/9)
 *  3. Verifica idempotência (o mesmo evento pode chegar mais de uma vez)
 *  4. Consulta o status REAL do pagamento direto na API do Mercado Pago
 *     (nunca confia cegamente no payload da notificação — a notificação
 *     é só um "avise-me", a fonte de verdade é a consulta subsequente)
 *  5. Aplica as automações correspondentes (apply-payment-update.ts)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature");
  const requestIdHeader = request.headers.get("x-request-id");

  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn("Webhook do Mercado Pago com corpo inválido (não é JSON)", { integration: "mercadopago" });
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const paymentId = payload.data?.id;
  if (payload.type !== "payment" || !paymentId) {
    // Mercado Pago envia outros tipos de notificação (ex: merchant_order) —
    // respondemos 200 para não gerar reenvio, mas não processamos nada.
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const signatureValid = verifyWebhookSignature({
    signatureHeader,
    requestIdHeader,
    dataId: paymentId,
  });

  if (!signatureValid) {
    logger.warn("Assinatura de webhook inválida — requisição recusada", {
      integration: "mercadopago",
      paymentId,
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  // Idempotência: registra o evento antes de processar. Se já existir
  // (conflito de unique key), significa que já processamos esta
  // notificação antes — respondemos 200 sem reaplicar a automação.
  const { error: insertEventError } = await supabase
    .from("webhook_events")
    .insert({ provider: "mercadopago", external_event_id: paymentId });

  if (insertEventError) {
    if (insertEventError.code === "23505") {
      logger.info("Webhook duplicado ignorado (idempotência)", { integration: "mercadopago", paymentId });
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    logger.error("Erro ao registrar evento de webhook", { integration: "mercadopago", error: insertEventError.message });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  try {
    const payment = await fetchPaymentStatus(paymentId);
    if (!payment.externalReference) {
      logger.warn("Pagamento sem external_reference — não é possível relacionar a um pedido", { paymentId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const statusMap: Record<string, PaymentStatus> = {
      approved: "aprovado",
      pending: "pendente",
      in_process: "pendente",
      rejected: "recusado",
      cancelled: "cancelado",
      refunded: "reembolsado",
    };
    const mappedStatus = statusMap[payment.status] ?? "pendente";

    await applyPaymentStatusUpdate(payment.externalReference, mappedStatus);

    logger.info("Webhook processado com sucesso", {
      integration: "mercadopago",
      orderId: payment.externalReference,
      status: mappedStatus,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error("Erro ao processar webhook do Mercado Pago", {
      integration: "mercadopago",
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Retornar 500 faz o Mercado Pago tentar reenviar depois — apropriado
    // para falhas transitórias (ex: banco temporariamente indisponível).
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
