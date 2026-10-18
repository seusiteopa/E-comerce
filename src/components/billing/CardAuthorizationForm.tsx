"use client";

import { useState, useTransition } from "react";
import Script from "next/script";
import Button from "@/components/ui/Button";
import { MP_PUBLIC_KEY } from "@/lib/integrations/mercadopago/public-key";
import { authorizeCardSubscriptionAction } from "@/actions/admin/assinatura";
import { formatCardExpiry } from "@/lib/checkout/mp-card";

type MPCardTokenInput = {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
};
type MPInstance = { createCardToken: (input: MPCardTokenInput) => Promise<{ id: string }> };
type MPConstructor = new (key: string, options?: { locale?: string }) => MPInstance;

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

/** Autoriza a mensalidade com cartão digitado na Vecorion. Os dados do cartão vão direto ao Mercado Pago pelo navegador. */
export default function CardAuthorizationForm({ monthlyFeeLabel }: { monthlyFeeLabel: string }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const MPClass = (window as unknown as { MercadoPago?: MPConstructor }).MercadoPago;
    if (!sdkReady || !MPClass) {
      setMessage("Carregando o formulário seguro. Tente de novo em alguns segundos.");
      return;
    }
    const [mm, yy] = expiry.split("/").map((v) => v.trim());
    startTransition(async () => {
      try {
        const mp = new MPClass(MP_PUBLIC_KEY, { locale: "pt-BR" });
        const token = await mp.createCardToken({
          cardNumber: number.replace(/\s/g, ""),
          cardholderName: name,
          cardExpirationMonth: mm ?? "",
          cardExpirationYear: yy ? (yy.length === 2 ? `20${yy}` : yy) : "",
          securityCode: cvv,
          identificationType: "CPF",
          identificationNumber: cpf.replace(/\D/g, ""),
        });
        const result = await authorizeCardSubscriptionAction({ cardToken: token.id });
        setMessage(result.success ? "Mensalidade autorizada. Seu primeiro mês é grátis." : result.error);
      } catch {
        setMessage("Não foi possível validar o cartão. Confira os dados e tente de novo.");
      }
    });
  }

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" onLoad={() => setSdkReady(true)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Autorize o cartão para a mensalidade de {monthlyFeeLabel}. O primeiro mês é grátis; as cobranças seguintes são feitas automaticamente.
        </p>
        <div>
          <label htmlFor="card_number" className="text-sm font-medium text-ink">Número do cartão</label>
          <input id="card_number" inputMode="numeric" autoComplete="cc-number" value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="card_name" className="text-sm font-medium text-ink">Nome impresso no cartão</label>
          <input id="card_name" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="card_expiry" className="text-sm font-medium text-ink">Validade (MM/AA)</label>
            <input id="card_expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={expiry} onChange={(e) => setExpiry(formatCardExpiry(e.target.value))} maxLength={5} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="card_cvv" className="text-sm font-medium text-ink">Código de segurança</label>
            <input id="card_cvv" inputMode="numeric" autoComplete="cc-csc" value={cvv} onChange={(e) => setCvv(e.target.value)} className={inputClass} required />
          </div>
        </div>
        <div>
          <label htmlFor="card_cpf" className="text-sm font-medium text-ink">CPF do titular</label>
          <input id="card_cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} className={inputClass} required />
        </div>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Autorizando..." : "Autorizar cartão"}</Button>
      </form>
    </>
  );
}
