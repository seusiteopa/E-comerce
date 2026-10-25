"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useStoreBase, withStoreBase } from "@/components/store/StoreLink";
import { formatCurrency } from "@/lib/format";

/**
 * Painel lateral do carrinho, aberto ao adicionar um produto.
 * Tocar fora fecha e a pessoa continua comprando. Tocar dentro vai para a página do carrinho.
 */
export default function CartDrawer() {
  const { lastAddedItem, items, subtotal } = useCart();
  const router = useRouter();
  const base = useStoreBase();
  // Fechar guarda o instante do último item adicionado; um novo item abre o painel de novo.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const open = lastAddedItem !== null && dismissedAt !== lastAddedItem.at;

  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Fechar carrinho e continuar comprando"
        onClick={() => setDismissedAt(lastAddedItem?.at ?? null)}
        className="absolute inset-0 bg-ink/30"
      />
      <aside
        role="dialog"
        aria-label="Carrinho"
        onClick={() => router.push(withStoreBase(base, "/carrinho"))}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm cursor-pointer flex-col gap-4 bg-surface p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Seu carrinho</h2>
          <span className="text-xs text-ink-soft">{items.length} {items.length === 1 ? "item" : "itens"}</span>
        </div>

        <ul className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variationId ?? ""}`} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-ink">
                {item.quantity}× {item.name}
                {item.variationLabel ? <span className="text-ink-soft"> ({item.variationLabel})</span> : null}
              </span>
              <span className="shrink-0 text-ink">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between text-sm font-semibold text-ink">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-2 text-center text-xs text-ink-soft">Toque aqui para ver o carrinho completo e finalizar</p>
        </div>
      </aside>
    </div>
  );
}
