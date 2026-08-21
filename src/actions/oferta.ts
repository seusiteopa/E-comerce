"use server";

import { z } from "zod";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { createPixPayment } from "@/lib/integrations/mercadopago";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const buyExclusiveSchema = z.object({
  productSlug: z.string().trim().min(1),
  payerName: z.string().trim().min(2, "Informe seu nome."),
  payerEmail: z.string().trim().email("E-mail inválido."),
  payerDocument: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "CPF inválido — informe apenas os 11 números."),
});

export interface BuyExclusiveResult {
  orderId: string;
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
}

export async function buyExclusiveProductAction(input: unknown): Promise<ActionResult<BuyExclusiveResult>> {
  const parsed = buyExclusiveSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Verifique os dados informados e tente novamente.");
  }

  const service = createSupabaseServiceClient();

  const { data: product } = await service
    .from("products")
    .select("*")
    .eq("slug", parsed.data.productSlug)
    .eq("status", "ativo")
    .eq("hidden", true)
    .maybeSingle();

  if (!product) {
    return actionError("Este link de oferta não está mais disponível.");
  }

  const total = Number(product.promo_price ?? product.price);

  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      profile_id: null,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      payer_email: parsed.data.payerEmail,
      status: "aguardando_pagamento",
    })
    .select()
    .single();

  if (orderError || !order) {
    logger.error("Erro ao criar pedido de oferta exclusiva", { slug: parsed.data.productSlug, error: orderError?.message });
    return actionError("Não foi possível registrar seu pedido agora. Tente novamente.");
  }

  const { error: itemError } = await service.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    variation_id: null,
    product_name_snapshot: product.name,
    product_type_snapshot: product.type,
    unit_price_snapshot: total,
    quantity: 1,
  });

  if (itemError) {
    logger.error("Erro ao criar item do pedido de oferta exclusiva", { orderId: order.id, error: itemError.message });
  }

  await service.from("payments").insert({ order_id: order.id, amount: total, status: "pendente" });

  try {
    const pix = await createPixPayment({
      orderId: order.id,
      totalAmount: total,
      description: `${product.name} — Vecorion`,
      payerEmail: parsed.data.payerEmail,
      payerDocument: parsed.data.payerDocument,
    });

    logger.info("Pagamento Pix criado para oferta exclusiva", { orderId: order.id, slug: parsed.data.productSlug });

    return actionSuccess({
      orderId: order.id,
      paymentId: pix.paymentId,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
    });
  } catch (error) {
    logger.error("Falha ao gerar Pix para oferta exclusiva", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Pedido registrado, mas não foi possível gerar o Pix. Tente novamente.");
  }
                       }
