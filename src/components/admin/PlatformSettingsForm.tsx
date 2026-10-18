"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import type { ActionResult } from "@/lib/action-result";

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

/** Configurações que só o dono da plataforma altera: mensalidade e domínio próprio. */
export default function PlatformSettingsForm({
  monthlyFeeReais,
  customDomain,
  saveAction,
}: {
  monthlyFeeReais: string;
  customDomain: string;
  saveAction: (input: { monthly_fee_reais: string; custom_domain: string }) => Promise<ActionResult>;
}) {
  const [fee, setFee] = useState(monthlyFeeReais);
  const [domain, setDomain] = useState(customDomain);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await saveAction({ monthly_fee_reais: fee, custom_domain: domain });
          setMessage(result.success ? "Configurações salvas." : result.error);
        });
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="monthly_fee" className="text-sm font-medium text-ink">Mensalidade (R$)</label>
        <input id="monthly_fee" value={fee} onChange={(e) => setFee(e.target.value)} className={inputClass} inputMode="decimal" />
      </div>
      <div>
        <label htmlFor="custom_domain" className="text-sm font-medium text-ink">Domínio próprio (opcional)</label>
        <input id="custom_domain" value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} placeholder="minhaloja.com.br" />
      </div>
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar configurações da plataforma"}</Button>
    </form>
  );
}
