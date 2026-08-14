"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartIndicator() {
  const { itemCount } = useCart();

  return (
    <Link href="/carrinho" aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper">
      <ShoppingCart size={20} className="text-ink" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-farol px-1 text-[11px] font-bold text-ink">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
