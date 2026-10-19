"use server";

import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { validateCoupon } from "@/domain/cupom/regras";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

interface CouponPreview {
  code: string;
  discountType: "percentual" | "fixo";
  discountValue: number;
  discountAmount: number;
}

/**
 * Validação de cupom para feedback imediato no carrinho, ANTES do
 * checkout. Usa a mesma regra central (validateCoupon) que o servidor
 * usa de novo, como fonte de verdade, no momento de criar o pedido —
 * então mesmo que alguém manipule o cliente, o desconto real aplicado
 * sempre é conferido de novo lá.
 */
export async function previewCouponAction(
  code: string,
  cartSubtotal: number,
  cartCategorySlug?: string,
  cartProductIds?: string[]
): Promise<ActionResult<CouponPreview>> {
  if (!(await rateLimit("cupom", 20, 10 * 60))) return actionError(TOO_MANY_MESSAGE);
  const normalized = code.trim().toUpperCase();
  if (!normalized) return actionError("Informe um código de cupom.");

  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data: coupon } = await supabase.from("coupons").select("*").eq("store_id", storeId).eq("code", normalized).maybeSingle();

  if (!coupon) {
    return actionError("Cupom inválido.");
  }

  // Uso anterior só é checado de verdade se a pessoa estiver logada —
  // visitante anônimo só vê a prévia, a checagem final acontece no
  // checkout de qualquer forma (exige login pra finalizar compra).
  const { data: { user } } = await supabase.auth.getUser();
  let previousUsageCount = 0;
  if (user) {
    // Pedidos do próprio cliente: a regra do banco já permite ler os próprios pedidos.
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("profile_id", user.id)
      .eq("coupon_code", coupon.code);
    previousUsageCount = count ?? 0;
  }

  const result = validateCoupon({
    coupon,
    now: new Date(),
    cartSubtotal,
    cartCategorySlug,
    cartProductIds,
    customerPreviousUsageCount: previousUsageCount,
  });

  if (!result.valid) {
    return actionError(result.reason ?? "Cupom inválido para este carrinho.");
  }

  return actionSuccess({
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    discountAmount: result.discountAmount ?? 0,
  });
}
