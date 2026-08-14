import { OrderStatus, PaymentStatus, ProductType } from "@/types";

/** Um pedido só pode ser cancelado pelo cliente se o pagamento ainda não foi aprovado. */
export function canCustomerCancelOrder(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  return status === "aguardando_pagamento" && paymentStatus !== "aprovado";
}

/**
 * Determina se um carrinho/pedido exige endereço de entrega.
 * Regra confirmada nas Etapas 1/3/5: só produto físico exige endereço.
 */
export function orderRequiresAddress(itemTypes: ProductType[]): boolean {
  return itemTypes.includes("fisico");
}

/** Mesma lógica para decidir se o cálculo de frete deve ser acionado (Etapa 4). */
export function orderRequiresShipping(itemTypes: ProductType[]): boolean {
  return orderRequiresAddress(itemTypes);
}

/**
 * Transição de status permitida quando o webhook de pagamento confirma
 * aprovação. Centralizar aqui evita que a regra de "o que acontece quando
 * um pedido é pago" fique espalhada pela camada de integração (Etapa 4,
 * Seção 7 — lista de automações).
 */
export function nextOrderStatusOnPaymentApproved(): OrderStatus {
  return "pago";
}

export function nextOrderStatusOnPaymentRejected(): OrderStatus {
  return "cancelado";
}

/**
 * Estoque só é decrementado quando o pagamento é aprovado — decisão
 * explícita do cliente (sem reserva temporária, sem expiração de pedido).
 * Esta função apenas documenta/centraliza a regra para quem for implementar
 * a automação na Etapa 10; a escrita real do decremento acontece via
 * Supabase (RPC/transação), não aqui.
 */
export function shouldDecrementStockOnStatus(newPaymentStatus: PaymentStatus): boolean {
  return newPaymentStatus === "aprovado";
}
