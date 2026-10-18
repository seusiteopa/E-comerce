"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createPixPayment } from "@/lib/integrations/mercadopago";
import { getStorePaymentContext, PaymentNotConnectedError } from "@/lib/integrations/mercadopago/oauth";
import { applyPaymentStatusUpdate } from "@/lib/integrations/mercadopago/apply-payment-update";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const counterOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(60),
  customerName: z.string().trim().max(60).optional().default(""),
  paymentMethod: z.enum(["pix", "dinheiro", "cartao"]),
});

export type CounterOrderResult =
  | { orderId: string; total: number; paymentMethod: "dinheiro" | "cartao"; paid: true }
  | { orderId: string; total: number; paymentMethod: "pix"; paid: false; qrCodeBase64: string; qrCode: string };

/**
 * Pedido de balcão: o lojista digita o que o cliente pediu e escolhe como foi pago.
 *  - Pix: gera QR Code (passa pelo Mercado Pago da loja, com a comissão do plano, se houver);
 *  - Dinheiro: só marca como pago;
 *  - Cartão: maquininha própria do lojista — só marca como pago, não passa pelo sistema.
 * Preços SEMPRE vêm do banco; o navegador só diz quais produtos e quantidades.
 */
export async function createCounterOrderAction(input: unknown): Promise<ActionResult<CounterOrderResult>> {
  const parsed = counterOrderSchema.safeParse(input);
  if (!parsed.success) return actionError("Confira os itens do pedido e tente de novo.");

  let store, profile;
  try {
    ({ store, profile } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // junta quantidades de linhas repetidas do mesmo produto
  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const productIds = [...quantities.keys()];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, type, price, promo_price")
    .in("id", productIds)
    .eq("store_id", store.id)
    .eq("status", "ativo");

  if (!products || products.length !== productIds.length) {
    return actionError("Algum item não está mais disponível. Atualize a página.");
  }

  const service = createSupabaseServiceClient();
  const { data: variations } = await service.from("product_variations").select("id, product_id, stock").in("product_id", productIds);

  const orderItems: {
    product_id: string;
    variation_id: string | null;
    product_name_snapshot: string;
    product_type_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
  }[] = [];
  let total = 0;

  for (const product of products) {
    const quantity = quantities.get(product.id)!;
    const unitPrice = Number(product.promo_price ?? product.price);
    let variationId: string | null = null;

    if (product.type === "fisico") {
      const productVariations = (variations ?? []).filter((v) => v.product_id === product.id);
      if (productVariations.length > 0) {
        const withStock = productVariations.find((v) => v.stock >= quantity);
        if (!withStock) return actionError(`Estoque insuficiente para "${product.name}".`);
        variationId = withStock.id;
      }
    }

    orderItems.push({
      product_id: product.id,
      variation_id: variationId,
      product_name_snapshot: product.name,
      product_type_snapshot: product.type,
      unit_price_snapshot: unitPrice,
      quantity,
    });
    total += unitPrice * quantity;
  }
  total = Math.round(total * 100) / 100;

  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      store_id: store.id,
      profile_id: null,
      channel: "balcao",
      customer_name: parsed.data.customerName || null,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      status: "aguardando_pagamento",
      payer_email: null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    logger.error("Erro ao criar pedido de balcão", { storeId: store.id, error: orderError?.message });
    return actionError("Não foi possível registrar o pedido agora.");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) {
    logger.error("Erro ao criar itens do pedido de balcão", { orderId: order.id, error: itemsError.message });
    await service.from("orders").delete().eq("id", order.id);
    return actionError("Não foi possível registrar os itens do pedido.");
  }

  await supabase.from("payments").insert({
    store_id: store.id,
    order_id: order.id,
    amount: total,
    method: parsed.data.paymentMethod,
    status: "pendente",
  });

  if (parsed.data.paymentMethod !== "pix") {
    try {
      await applyPaymentStatusUpdate(order.id, "aprovado", { skipEmail: true });
    } catch (error) {
      logger.error("Pedido de balcão criado mas falhou ao marcar como pago", {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return actionError("O pedido foi criado, mas não foi possível marcá-lo como pago. Confira em Pedidos.");
    }
    return actionSuccess({ orderId: order.id, total, paymentMethod: parsed.data.paymentMethod, paid: true });
  }

  try {
    const context = await getStorePaymentContext(store);
    const pix = await createPixPayment({
      orderId: order.id,
      totalAmount: total,
      description: `Pedido de balcão — ${store.name}`,
      payerEmail: user?.email ?? profile.id + "@balcao.invalid",
      accessToken: context.accessToken,
      applicationFee: context.feeFor(total),
      storeId: store.id,
    });
    await service.from("payments").update({ external_reference: pix.paymentId }).eq("order_id", order.id);
    return actionSuccess({
      orderId: order.id,
      total,
      paymentMethod: "pix",
      paid: false,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
    });
  } catch (error) {
    // pedido sem pagamento não deve ficar pendurado no painel
    await service.from("orders").update({ status: "cancelado" }).eq("id", order.id);
    if (error instanceof PaymentNotConnectedError) {
      return actionError("Conecte o Mercado Pago em “Pagamentos e plano” para receber por Pix.");
    }
    logger.error("Falha ao gerar Pix do pedido de balcão", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Não foi possível gerar o Pix agora. Tente novamente ou receba em dinheiro/cartão.");
  }
}

export async function getCounterOrderPaidAction(orderId: string): Promise<ActionResult<{ paid: boolean }>> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito.");
  }
  const service = createSupabaseServiceClient();
  const { data } = await service.from("payments").select("status").eq("order_id", orderId).eq("store_id", store.id).maybeSingle();
  return actionSuccess({ paid: data?.status === "aprovado" });
}
