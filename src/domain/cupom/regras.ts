import { CouponRow } from "@/types/database";

export interface CouponValidationInput {
  coupon: CouponRow;
  now: Date;
  cartSubtotal: number;
  cartCategorySlug?: string;
  cartProductIds?: string[];
  customerPreviousUsageCount: number;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  discountAmount?: number;
}

/**
 * Validação de cupom centralizada — usada tanto no carrinho (feedback
 * imediato ao cliente) quanto no servidor no momento de criar o pedido
 * (fonte de verdade, nunca confiar só na validação do cliente — Etapa 7).
 */
export function validateCoupon(input: CouponValidationInput): CouponValidationResult {
  const { coupon, now, cartSubtotal, cartCategorySlug, cartProductIds, customerPreviousUsageCount } = input;

  if (!coupon.active) {
    return { valid: false, reason: "Este cupom não está mais ativo." };
  }

  if (new Date(coupon.valid_from) > now) {
    return { valid: false, reason: "Este cupom ainda não está válido." };
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, reason: "Este cupom expirou." };
  }

  if (coupon.usage_limit_per_customer && customerPreviousUsageCount >= coupon.usage_limit_per_customer) {
    return { valid: false, reason: "Você já utilizou este cupom o número máximo de vezes permitido." };
  }

  if (coupon.scope_category_slug && coupon.scope_category_slug !== cartCategorySlug) {
    return { valid: false, reason: "Este cupom não é válido para os itens do seu carrinho." };
  }

  if (coupon.scope_product_id && !cartProductIds?.includes(coupon.scope_product_id)) {
    return { valid: false, reason: "Este cupom não é válido para os itens do seu carrinho." };
  }

  const discountAmount =
    coupon.discount_type === "percentual"
      ? (cartSubtotal * coupon.discount_value) / 100
      : Math.min(coupon.discount_value, cartSubtotal);

  return { valid: true, discountAmount };
}
