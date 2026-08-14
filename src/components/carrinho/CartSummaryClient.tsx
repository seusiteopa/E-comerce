"use client";

import { useCart } from "@/lib/cart-context";
import CartSummary from "@/components/carrinho/CartSummary";

export default function CartSummaryClient() {
  const { subtotal, items } = useCart();
  const hasPhysicalItem = items.some((i) => i.type === "fisico");

  return (
    <CartSummary
      subtotal={subtotal}
      shipping={hasPhysicalItem ? null : 0}
      checkoutHref={items.length > 0 ? "/checkout" : undefined}
    />
  );
}
