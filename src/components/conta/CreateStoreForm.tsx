"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { createStoreAction } from "@/actions/stores";

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function CreateStoreForm({ rootDomain, monthlyFee }: { rootDomain: string | null; monthlyFee: string | null }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [storeType, setStoreType] = useState("loja");
  const [whatsapp, setWhatsapp] = useState("");
  const plan = "mensalidade" as const;
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ storeUrl: string; subscriptionFailed: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createStoreAction({ name, slug, storeType, whatsapp, plan });
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.data.authorizationUrl) {
        window.location.href = result.data.authorizationUrl; // leva ao banco para autorizar a mensalidade
        return;
      }
      setDone({ storeUrl: result.data.storeUrl, subscriptionFailed: result.data.subscriptionFailed });
    });
  }

  if (done) {
    return (
      <div className="mt-8 flex flex-col gap-3 text-sm text-ink">
        <p role="status" className="font-semibold">Loja criada!</p>
        {done.subscriptionFailed && (
          <p>Não conseguimos iniciar a mensalidade agora. Sem problema: autorize depois em &quot;Pagamentos e plano&quot; no painel.</p>
        )}
        <p>Entre no painel da sua loja (você vai precisar fazer login de novo nesse endereço) e conecte o seu Mercado Pago para receber pagamentos.</p>
        <a href={done.storeUrl} className="font-semibold text-navy underline">Abrir o painel da minha loja</a>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Nome da loja</label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(toSlug(e.target.value));
          }}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="slug" className="text-sm font-medium text-ink">Endereço da loja</label>
        <input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(toSlug(e.target.value));
          }}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">{rootDomain ? `${slug || "sua-loja"}.${rootDomain}` : "O endereço público é definido pelo administrador da plataforma."}</p>
      </div>
      <div>
        <label htmlFor="storeType" className="text-sm font-medium text-ink">Tipo de loja</label>
        <select id="storeType" value={storeType} onChange={(e) => setStoreType(e.target.value)} className={inputClass}>
          <option value="loja">Loja (produtos)</option>
          <option value="restaurante">Lanchonete / restaurante</option>
          <option value="digital">Produtos digitais</option>
          <option value="misto">Misto</option>
        </select>
      </div>
      <div>
        <label htmlFor="whatsapp" className="text-sm font-medium text-ink">WhatsApp da loja (com DDD, opcional)</label>
        <input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="5519999999999" />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium text-ink">Plano da loja</legend>
        {monthlyFee && (
          <p className="text-sm text-ink">
            <strong>Mensalidade de R$ {monthlyFee}</strong>, sem comissão sobre as vendas. <strong>Primeiro mês grátis:</strong> você autoriza no seu cartão agora e a cobrança automática só começa daqui a 1 mês.
            <span className="mt-1 block text-xs text-ink-soft">A mensalidade é cobrada no cartão de crédito. O Pix não é aceito nessa cobrança automática.</span>
          </p>
        )}
      </fieldset>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      <Button type="button" onClick={handleSubmit} disabled={isPending || !name || !slug}>
        {isPending ? "Criando..." : plan === "mensalidade" ? "Criar loja e autorizar no banco" : "Criar loja"}
      </Button>
    </div>
  );
}
