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
import { createCardPayment, createPaymentPreference, createPixPayment, fetchPaymentStatus } from "@/lib/integrations/mercadopago";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCurrentStore, getRequestOrigin } from "@/lib/store/current";
import { getStorePaymentContext, PaymentNotConnectedError, type StorePaymentContext } from "@/lib/integrations/mercadopago/oauth";


/** Avisa o contato da loja (e-mail cadastrado nas configurações) sobre pagamento que não concluiu. Nunca bloqueia a venda. */
async function notifyStorePaymentFailure(storeId: string, storeName: string, orderId: string, reason: string): Promise<void> {
  try {
    const service = createSupabaseServiceClient();
    const { data: setting } = await service
      .from("site_settings")
      .select("value")
      .eq("store_id", storeId)
      .eq("key", "contact_email")
      .maybeSingle();
    const email = setting?.value?.trim();
    if (!email) return;
    await sendTransactionalEmail({
      event: "falha_pagamento",
      to: { email, name: storeName },
      data: { orderId, storeName, reason },
    });
  } catch {
    logger.warn("Aviso de falha de pagamento não pôde ser enviado", { storeId, orderId });
  }
}

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
      paymentMethod: "card";
      paymentId: string;
      status: string;
    }
  | {
      orderId: string;
      total: number;
      paymentMethod: "redirect";
      checkoutUrl: string;
    };

/** Traduz o motivo da recusa do Mercado Pago para algo que a pessoa consiga resolver. */
function cardRejectionMessage(detail: string | null): string {
  switch (detail) {
    case "cc_rejected_insufficient_amount":
      return "Cartão sem saldo ou limite suficiente para este pagamento.";
    case "cc_rejected_bad_filled_card_number":
    case "cc_rejected_bad_filled_date":
    case "cc_rejected_bad_filled_security_code":
    case "cc_rejected_bad_filled_other":
      return "Algum dado do cartão está incorreto. Confira número, validade e código de segurança.";
    case "cc_rejected_call_for_authorize":
      return "O banco pediu autorização para este pagamento. Ligue para o banco ou use outro cartão.";
    case "cc_rejected_card_disabled":
      return "Este cartão está desabilitado. Fale com o banco ou use outro cartão.";
    case "cc_rejected_high_risk":
      return "O pagamento não foi aprovado por segurança. Tente outro cartão ou pague com Pix.";
    case "cc_rejected_duplicated_payment":
      return "Já existe um pagamento igual em análise. Aguarde alguns minutos.";
    default:
      return "Este cartão não aprovou o pagamento. Tente outro cartão ou pague com Pix.";
  }
}

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

  const store = await getCurrentStore();
  const storeId = store.id;

  // Loja pausada pelo dono da plataforma não aceita pedidos novos.
  if (store.status === "pausada") {
    return actionError("Esta loja está temporariamente indisponível.");
  }
  // Cada loja cobra com a PRÓPRIA conta Mercado Pago (OAuth). Sem conexão, não há como cobrar:
  // nunca usar o token de outra conta (o dinheiro cairia no lugar errado).
  let paymentContext: StorePaymentContext;
  try {
    paymentContext = await getStorePaymentContext(store);
  } catch (error) {
    if (error instanceof PaymentNotConnectedError) {
      return actionError("Esta loja ainda não está habilitada para pagamentos online.");
    }
    logger.error("Falha ao preparar pagamento da loja", {
      storeId,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Não foi possível iniciar o pagamento agora. Tente novamente em instantes.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payerEmail = user?.email ?? "";

  const productIds = parsed.data.items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("store_id", storeId)
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
      const variation = (variations as ProductVariationRow[]).find((v) => v.id === item.variationId && v.product_id === product.id);
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
      .eq("store_id", storeId)
      .eq("code", parsed.data.couponCode.toUpperCase())
      .maybeSingle();

    if (!coupon) {
      return actionError("Cupom inválido.");
    }

    const { count: previousUsage } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
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
      store_id: storeId,
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
    store_id: storeId,
    order_id: order.id,
    amount: total,
    status: "pendente",
  });

  if (paymentError) {
    logger.error("Erro ao criar registro de pagamento", { orderId: order.id, error: paymentError.message });
  }

  const description = `Pedido ${order.id} — ${store.name}`;

  let result: CreateOrderResult;
  try {
    if (parsed.data.paymentMethod === "pix") {
      const pix = await createPixPayment({
        orderId: order.id,
        totalAmount: total,
        description,
        payerEmail,
        payerDocument: parsed.data.payerDocument,
        accessToken: paymentContext.accessToken,
        applicationFee: paymentContext.feeFor(total),
        storeId,
      });
      result = {
        orderId: order.id,
        total,
        paymentMethod: "pix",
        paymentId: pix.paymentId,
        qrCodeBase64: pix.qrCodeBase64,
        qrCode: pix.qrCode,
      };
    } else if (parsed.data.paymentMethod === "cartao") {
      if (!parsed.data.cardToken || !parsed.data.cardPaymentMethodId) {
        return actionError("Confira os dados do cartão e tente novamente.");
      }
      const card = await createCardPayment({
        orderId: order.id,
        totalAmount: total,
        description,
        payerEmail,
        payerDocument: parsed.data.payerDocument,
        cardToken: parsed.data.cardToken,
        paymentMethodId: parsed.data.cardPaymentMethodId,
        accessToken: paymentContext.accessToken,
        applicationFee: paymentContext.feeFor(total),
        storeId,
      });
      if (card.status === "rejected") {
        logger.warn("Cartão recusado pelo Mercado Pago", { orderId: order.id, statusDetail: card.statusDetail, integration: "mercadopago" });
        await notifyStorePaymentFailure(store.id, store.name, order.id, cardRejectionMessage(card.statusDetail));
        return actionError(cardRejectionMessage(card.statusDetail));
      }
      result = { orderId: order.id, total, paymentMethod: "card", paymentId: card.paymentId, status: card.status };
    } else {
      const preference = await createPaymentPreference({
        orderId: order.id,
        totalAmount: total,
        description,
        payerEmail,
        payerDocument: parsed.data.payerDocument,
        accessToken: paymentContext.accessToken,
        applicationFee: paymentContext.feeFor(total),
        storeId,
        storeOrigin: await getRequestOrigin(),
      });
      result = { orderId: order.id, total, paymentMethod: "redirect", checkoutUrl: preference.checkoutUrl };
    }
  } catch (error) {
    logger.error("Pedido criado mas falhou ao iniciar pagamento", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    await notifyStorePaymentFailure(store.id, store.name, order.id, "não foi possível iniciar o pagamento");
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
    const store = await getCurrentStore();
    const paymentContext = await getStorePaymentContext(store);
    const result = await fetchPaymentStatus(paymentId, paymentContext.accessToken);
    return actionSuccess({ status: result.status });
  } catch (error) {
    logger.error("Erro ao consultar status do pagamento Pix", {
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return actionError("Não foi possível verificar o status do pagamento agora.");
  }
}
