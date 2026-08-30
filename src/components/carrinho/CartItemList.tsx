"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/format";
import QuantitySelector from "@/components/carrinho/QuantitySelector";
import { ProductTypeBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default function CartItemList() {
  const { items, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Explore o catálogo e adicione produtos ao carrinho."
        action={<LinkButton href="/produtos">Ver produtos</LinkButton>}
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map((item) => (
        <li key={`${item.productSlug}-${item.variationId ?? "default"}`} className="flex gap-4 p-4 sm:p-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
            <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <ProductTypeBadge type={item.type} />
                <Link href={`/produtos/${item.productSlug}`} className="mt-1 block text-sm font-semibold text-ink hover:underline">
                  {item.name}
                </Link>
                {item.variationLabel && <p className="text-xs text-ink-soft">{item.variationLabel}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productSlug, item.variationId)}
                aria-label={`Remover ${item.name} do carrinho`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-status-danger"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              {item.type === "fisico" ? (
                <QuantitySelector
                  quantity={item.quantity}
                  onChange={(q) => updateQuantity(item.productSlug, q, item.variationId)}
                />
              ) : (
                <span className="text-xs text-ink-soft">Quantidade: 1</span>
              )}
              <span className="text-sm font-semibold text-ink">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
