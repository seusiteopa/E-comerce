"use client";

import { useCart } from "@/lib/cart-context";
import CartSummary from "@/components/carrinho/CartSummary";

export default function CartSummaryClient() {
  const { subtotal, items, coupon } = useCart();
  const hasPhysicalItem = items.some((i) => i.type === "fisico");

  return (
    <CartSummary
      subtotal={subtotal}
      shipping={hasPhysicalItem ? null : 0}
      discount={coupon?.discountAmount ?? 0}
      checkoutHref={items.length > 0 ? "/checkout" : undefined}
    />
  );
}
