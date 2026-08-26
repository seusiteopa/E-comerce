"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createCouponAction } from "@/actions/admin/cupons";

export default function CouponForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState("percentual");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCouponAction(formData);
      if (result.success) {
        router.refresh();
        const form = document.getElementById("coupon-form") as HTMLFormElement | null;
        form?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form id="coupon-form" action={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="code" className="text-sm font-medium text-ink">Código do cupom</label>
        <input
          id="code"
          name="code"
          type="text"
          required
          placeholder="BEMVINDO10"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm uppercase outline-none focus:border-navy"
        />
        <p className="mt-1 text-xs text-ink-soft">3 a 20 letras/números, sem espaço. É como o cliente vai digitar no checkout.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="discountType" className="text-sm font-medium text-ink">Tipo de desconto</label>
          <select
            id="discountType"
            name="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label htmlFor="discountValue" className="text-sm font-medium text-ink">
            {discountType === "percentual" ? "Desconto (%)" : "Desconto (R$)"}
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="validUntil" className="text-sm font-medium text-ink">Válido até (opcional)</label>
          <input id="validUntil" name="validUntil" type="date" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
        <div>
          <label htmlFor="usageLimit" className="text-sm font-medium text-ink">Limite total de usos (opcional)</label>
          <input id="usageLimit" name="usageLimit" type="number" min="1" placeholder="Sem limite" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
      </div>

      <div>
        <label htmlFor="usageLimitPerCustomer" className="text-sm font-medium text-ink">Usos por cliente</label>
        <input
          id="usageLimitPerCustomer"
          name="usageLimitPerCustomer"
          type="number"
          min="1"
          defaultValue={1}
          className="mt-2 w-full max-w-[160px] rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-[#173F82]" />
        Ativo
      </label>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Criar cupom"}
      </Button>
    </form>
  );
}
