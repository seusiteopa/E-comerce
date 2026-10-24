"use client";

import { useState, useTransition } from "react";
import { createClientStoreAction } from "@/actions/parceiro/loja";
import Button from "@/components/ui/Button";

const field = "rounded-xl border border-line bg-surface px-4 py-3 text-sm";

export default function NewClientStoreForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [storeType, setStoreType] = useState("loja");
  const [whatsapp, setWhatsapp] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const r = await createClientStoreAction({ name, slug, storeType, whatsapp, clientEmail });
      if (r.success) {
        setMessage(`Loja criada. Endereço: /lojas/${r.data.slug}`);
        setName(""); setSlug(""); setWhatsapp(""); setClientEmail("");
      } else {
        setMessage(r.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold text-ink">Criar loja para um cliente</h2>
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da loja" />
      <input className={field} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="Endereço (ex.: minha-loja)" />
      <select className={field} value={storeType} onChange={(e) => setStoreType(e.target.value)}>
        <option value="loja">Loja</option>
        <option value="restaurante">Restaurante</option>
        <option value="digital">Digital</option>
        <option value="misto">Misto</option>
      </select>
      <input className={field} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (opcional)" />
      <input className={field} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="E-mail do cliente (responsável pelo pagamento)" />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending || !name || !slug || !clientEmail}>
          {pending ? "Criando..." : "Criar loja"}
        </Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
