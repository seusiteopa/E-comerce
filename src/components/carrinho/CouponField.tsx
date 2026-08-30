"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import { previewCouponAction } from "@/actions/coupons";
import { formatCurrency } from "@/lib/format";

export default function CouponField() {
  const { items, subtotal, coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await previewCouponAction(
        code,
        subtotal,
        undefined,
        items.map((i) => i.productId)
      );
      if (result.success) {
        applyCoupon({ code: result.data.code, discountAmount: result.data.discountAmount });
        setCode("");
      } else {
        setError(result.error);
      }
    });
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-status-success/40 bg-status-success/5 p-3">
        <p className="text-sm text-ink">
          Cupom <strong>{coupon.code}</strong> aplicado — desconto de {formatCurrency(coupon.discountAmount)}
        </p>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label="Remover cupom"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft hover:bg-paper"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3">
        <label htmlFor="coupon" className="sr-only">
          Código do cupom
        </label>
        <input
          id="coupon"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código do cupom"
          className="flex-1 bg-transparent px-2 text-sm uppercase outline-none"
        />
        <Button type="submit" variant="secondary" className="px-4 py-2 text-xs" disabled={isPending || !code.trim()}>
          {isPending ? "Verificando..." : "Aplicar"}
        </Button>
      </div>
      {error && <p role="alert" className="px-1 text-xs text-status-danger">{error}</p>}
    </form>
  );
}
