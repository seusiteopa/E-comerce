"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile, UnauthorizedError } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation/schemas";
import { validateCoupon } from "@/domain/cupom/regras";
import { orderRequiresAddress } from "@/domain/pedido/regras";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { ProductType } from "@/types";
import { ProductRow, ProductVariationRow } from "@/types/database";
import { createPaymentPreference, createPixPayment, fetchPaymentStatus } from "@/lib/integrations/mercadopago";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type CreateOrderResult =
  | {
      orderId: string;
      total: number;
      paymentMethod: "pix";
      paymentId: string;
      qrCodeBase64: string;
      qrCode: string;
    }
  | {
      orderId: string;
      total: number;
      paymentMethod: "redirect";
      checkoutUrl: string;
    };

export async function createOrderAction(input: unknown): Promise<ActionResult<CreateOrderResult>> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Não foi possível processar seu carrinho. Atualize a página e tente novamente.");
  }

  let profile;
  try {
    profile = await requireAuthenticatedProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return actionError("Faça login para finalizar a compra.");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payerEmail = user?.email ?? "";

  const productIds = parsed.data.items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("status", "ativo");

  if (productsError || !products || products.length !== productIds.length) {
    return actionError("Um ou mais itens do seu carrinho não estão mais disponíveis.");
  }

  const variationIds = parsed.data.items.map((i) => i.variationId).filter(Boolean) as string[];
  const { data: variations } = variationIds.length
    ? await supabase.from("product_variations").select("*").in("id", variationIds)
    : { data: [] as ProductVariationRow[] };

  const orderItemsToInsert: {
    product_id: string;
    variation_id: string | null;
    product_name_snapshot: string;
    product_type_snapshot: ProductType;
    unit_price_snapshot: number;
    quantity: number;
  }[] = [];

  let subtotal = 0;
  const itemTypes: ProductType[] = [];

  for (const item of parsed.data.items) {
    const product = (products as ProductRow[]).find((p) => p.id === item.productId);
    if (!product) return actionError("Produto não encontrado.");

    itemTypes.push(product.type);

    const unitPrice = Number(product.promo_price ?? product.price);

    if (product.type === "fisico") {
      const variation = (variations as ProductVariationRow[]).find((v) => v.id === item.variationId);
      if (!variation) {
        return actionError(`Selecione uma variação válida para "${product.name}".`);
      }
      if (variation.stock < item.quantity) {
        return actionError(`Estoque insuficiente para "${product.name}" (disponível: ${variation.stock}).`);
      }
    }

    orderItemsToInsert.push({
      product_id: product.id,
      variation_id: item.variationId ?? null,
      product_name_snapshot: product.name,
      product_type_snapshot: product.type,
      unit_price_snapshot: unitPrice,
      quantity: item.quantity,
    });

    subtotal += unitPrice * item.quantity;
  }

  const needsAddress = orderRequiresAddress(itemTypes);
  if (needsAddress && !parsed.data.addressId) {
    return actionError("Informe um endereço de entrega para os itens físicos do seu carrinho.");
  }

  let discount = 0;
  if (parsed.data.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", parsed.data.couponCode.toUpperCase())
      .maybeSingle();

    if (!coupon) {
      return actionError("Cupom inválido.");
    }

    const { count: previousUsage } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("coupon_code", coupon.code);

    const validation = validateCoupon({
      coupon,
      now: new Date(),
      cartSubtotal: subtotal,
      customerPreviousUsageCount: previousUsage ?? 0,
    });

    if (!validation.valid) {
      return actionError(validation.reason ?? "Cupom inválido para este carrinho.");
    }

    discount = validation.discountAmount ?? 0;
  }

  let shipping = 0;
  if (needsAddress) {
    const { data: address } = await supabase
      .from("addresses")
      .select("zip_code")
      .eq("id", parsed.data.addressId!)
      .eq("profile_id", profile.id)
      .single();

    if (!address) {
      return actionError("Endereço não encontrado para o seu usuário.");
    }

    try {
      const { calculateShipping } = await import("@/lib/integrations/correios");
      const totalWeightGrams = orderItemsToInsert.reduce((sum, item) => sum + 500 * item.quantity, 0);
      const options = await calculateShipping({
        destinationZipCode: address.zip_code,
        totalWeightGrams,
        dimensions: { widthCm: 20, heightCm: 10, lengthCm: 30 },
      });
      const chosen = options.find((o) => o.method === parsed.data.shippingMethod) ?? options[0];
      shipping = chosen.price;
    } catch (error) {
      logger.error("Falha ao calcular frete durante criação do pedido", {
        userId: profile.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return actionError("Não foi possível confirmar o valor do frete agora. Tente novamente.");
    }
  }

  const total = subtotal + shipping - discount;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      profile_id: profile.id,
      address_id: parsed.data.addressId ?? null,
      subtotal,
      shipping,
      discount,
      total,
      coupon_code: parsed.data.couponCode?.toUpperCase() ?? null,
      payer_email: payerEmail,
      status: "aguardando_pagamento",
    })
    .select()
    .single();

  if (orderError || !order) {
    logger.error("Erro ao criar pedido", { userId: profile.id, error: orderError?.message });
    return actionError("Não foi possível criar seu pedido agora. Tente novamente.");
  }

  const serviceClient = createSupabaseServiceClient();

  const { error: itemsError } = await serviceClient
    .from("order_items")
    .insert(orderItemsToInsert.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    logger.error("Erro ao criar itens do pedido", { orderId: order.id, error: itemsError.message });
    return actionError("Não foi possível registrar os itens do seu pedido.");
  }

  const { error: paymentError } = await serviceClient.from("payments").insert({
    order_id: order.id,
    amount: total,
    status: "pendente",
  });

  if (paymentError) {
    logger.error("Erro ao criar registro de pagamento", { orderId: order.id, error: paymentError.message });
  }

  const description = `Pedido ${order.id} — Loja Vecorion`;

  let result: CreateOrderResult;
  try {
    if (parsed.data.paymentMethod === "pix") {
      const pix = await createPixPayment({
        orderId: order.id,
        totalAmount: total,
        description,
        payerEmail,
        payerDocument: parsed.data.payerDocument,
      });
      result = {
        orderId: order.id,
        total,
        paymentMethod: "pix",
        paymentId: pix.paymentId,
        qrCodeBase64: pix.qrCodeBase64,
        qrCode: pix.qrCode,
      };
    } else {
      const preference = await createPaymentPreference({
        orderId: order.id,
        totalAmount: total,
        description,
        payerEmail,
        payerDocument: parsed.data.payerDocument,
      });
      result = { orderId: order.id, total, paymentMethod: "redirect", checkoutUrl: preference.checkoutUrl };
    }
  } catch (error) {
    logger.error("Pedido criado mas falhou ao iniciar pagamento", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Seu pedido foi registrado, mas não foi possível iniciar o pagamento. Tente novamente.");
  }

  try {
    await sendTransactionalEmail({
      event: "pedido_criado",
      to: { email: payerEmail, name: profile.full_name },
      data: { orderId: order.id, customerName: profile.full_name, total: `R$ ${total.toFixed(2)}` },
    });
  } catch {
    logger.warn("E-mail de pedido criado não pôde ser enviado", { orderId: order.id });
  }

  logger.info("Pedido criado", { orderId: order.id, userId: profile.id, paymentMethod: parsed.data.paymentMethod });

  return actionSuccess(result);
}

export async function getPixPaymentStatusAction(
  paymentId: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const result = await fetchPaymentStatus(paymentId);
    return actionSuccess({ status: result.status });
  } catch (error) {
    logger.error("Erro ao consultar status do pagamento Pix", {
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Não foi possível verificar o status do pagamento agora.");
  }
}
