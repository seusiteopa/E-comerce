"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useStoreBase, withStoreBase } from "@/components/store/StoreLink";
import { formatCurrency } from "@/lib/format";

/**
 * Aba lateral do carrinho, aberta ao adicionar um produto.
 * Fecha com o X, com "Continuar comprando" ou tocando fora. Só vai ao carrinho pelo botão "Ver carrinho".
 */
export default function CartDrawer() {
  const { lastAddedItem, items, subtotal } = useCart();
  const router = useRouter();
  const base = useStoreBase();
  // Fechar guarda o instante do último item; um novo item abre a aba de novo.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const open = lastAddedItem !== null && dismissedAt !== lastAddedItem.at;

  if (!open || items.length === 0) return null;

  const close = () => setDismissedAt(lastAddedItem?.at ?? null);

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Fechar carrinho" onClick={close} className="absolute inset-0 bg-ink/30" />
      <aside
        role="dialog"
        aria-label="Carrinho"
        className="absolute bottom-0 left-0 right-0 flex max-h-[62vh] flex-col gap-4 rounded-t-2xl bg-surface p-5 shadow-xl sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[360px] sm:rounded-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Produto adicionado</h2>
          <button type="button" aria-label="Fechar" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper">
            ✕
          </button>
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={close} className="flex h-11 items-center justify-center rounded-full border border-line text-sm font-medium text-ink hover:bg-paper">
              Continuar comprando
            </button>
            <button
              type="button"
              onClick={() => router.push(withStoreBase(base, "/carrinho"))}
              className="flex h-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white hover:opacity-90"
            >
              Ver carrinho
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
