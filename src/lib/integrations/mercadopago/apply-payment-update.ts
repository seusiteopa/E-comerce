import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { generateDigitalDownloadLink } from "@/lib/integrations/storage/digital-delivery";
import { nextOrderStatusOnPaymentApproved, nextOrderStatusOnPaymentRejected } from "@/domain/pedido/regras";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/format";
import { PaymentStatus } from "@/types";

/**
 * Aplica, em sequência, as automações definidas na Etapa 4 (Seção 7) para
 * quando um pagamento é aprovado:
 *  1. Atualiza status do pedido e do pagamento
 *  2. Decrementa estoque de itens físicos (só agora — decisão confirmada:
 *     sem reserva prévia, sem expiração de pedido)
 *  3. Gera link de download para itens digitais
 *  4. Dispara e-mail de confirmação via Brevo
 *
 * Chamado exclusivamente pelo webhook do Mercado Pago, depois que a
 * assinatura já foi validada e a idempotência já foi checada.
 */
export async function applyPaymentStatusUpdate(orderId: string, newStatus: PaymentStatus): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("*, profiles(full_name), order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderFetchError || !order) {
    logger.error("Pedido não encontrado ao processar atualização de pagamento", { orderId });
    throw new Error(`Pedido ${orderId} não encontrado.`);
  }

  await supabase.from("payments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("order_id", orderId);

  if (newStatus === "aprovado") {
    await handleApproved(supabase, order, orderId);
  } else if (newStatus === "recusado" || newStatus === "cancelado") {
    await supabase
      .from("orders")
      .update({ status: nextOrderStatusOnPaymentRejected(), updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }
  // "pendente" e "reembolsado" não disparam automação adicional nesta versão.
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleApproved(supabase: any, order: any, orderId: string) {
  await supabase
    .from("orders")
    .update({ status: nextOrderStatusOnPaymentApproved(), updated_at: new Date().toISOString() })
    .eq("id", orderId);

  // Decremento de estoque — só para itens físicos, só agora que o
  // pagamento foi confirmado (decisão explícita do cliente).
  for (const item of order.order_items) {
    if (item.product_type_snapshot === "fisico" && item.variation_id) {
      const { error } = await supabase.rpc("decrement_variation_stock", {
        variation_id: item.variation_id,
        amount: item.quantity,
      });
      if (error) {
        logger.error("Falha ao decrementar estoque", { orderId, variationId: item.variation_id, error: error.message });
      }
    }
  }

  // Geração de link de download para itens digitais.
  const digitalItems = order.order_items.filter((i: { product_type_snapshot: string }) => i.product_type_snapshot === "digital");
  for (const item of digitalItems) {
    const link = await generateDigitalDownloadLink(item.product_id);
    if (link) {
      logger.info("Link de download gerado", { orderId, productId: item.product_id });
      // O link fica disponível para a área do cliente buscar sob demanda
      // (gerado novamente a cada acesso, não armazenado — expira em 7 dias
      // por chamada, conforme lib/integrations/storage/digital-delivery.ts).
    }
  }

  // E-mail de confirmação (Etapa 4, Seção 5) — falha de e-mail é logada,
  // mas não desfaz a confirmação do pagamento (já processada com sucesso).
  try {
    await sendTransactionalEmail({
      event: "pagamento_aprovado",
      to: { email: order.payer_email ?? "", name: order.profiles?.full_name ?? "Cliente" },
      data: {
        orderId,
        customerName: order.profiles?.full_name ?? "Cliente",
        extraMessage: buildExtraMessageByItemTypes(order.order_items),
      },
    });
  } catch (error) {
    logger.warn("Falha ao enviar e-mail de pagamento aprovado (pedido já processado normalmente)", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("Automações de pagamento aprovado concluídas", { orderId, total: formatCurrency(order.total) });
}

function buildExtraMessageByItemTypes(items: { product_type_snapshot: string }[]): string {
  const hasDigital = items.some((i) => i.product_type_snapshot === "digital");
  const hasPhysical = items.some((i) => i.product_type_snapshot === "fisico");

  const parts: string[] = [];
  if (hasDigital) parts.push("Seus downloads já estão disponíveis na sua conta.");
  if (hasPhysical) parts.push("Seu pedido está sendo preparado para envio.");
  return parts.join(" ");
}
