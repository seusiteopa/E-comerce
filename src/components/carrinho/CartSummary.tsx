"use client";

import { formatCurrency } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";

export default function CartSummary({
  subtotal,
  shipping = null,
  discount = 0,
  checkoutHref,
  checkoutLabel = "Finalizar compra",
}: {
  subtotal: number;
  shipping?: number | null;
  discount?: number;
  checkoutHref?: string;
  checkoutLabel?: string;
}) {
  const total = subtotal + (shipping ?? 0) - discount;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Resumo do pedido</h2>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="text-ink">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Frete</dt>
          <dd className="text-ink">{shipping === null ? "Calculado no checkout" : shipping === 0 ? "Grátis" : formatCurrency(shipping)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">Desconto</dt>
            <dd className="text-status-success">−{formatCurrency(discount)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex justify-between border-t border-line pt-4">
        <span className="font-semibold text-ink">Total</span>
        <span className="text-lg font-semibold text-navy">{formatCurrency(total)}</span>
      </div>
      {checkoutHref && (
        <LinkButton href={checkoutHref} variant="primary" className="mt-6 w-full">
          {checkoutLabel}
        </LinkButton>
      )}
    </div>
  );
}
