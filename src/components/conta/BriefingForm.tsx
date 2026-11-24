"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { createServiceBriefAction } from "@/actions/briefing";
import { BRIEF_KINDS, BRIEF_LABEL, type BriefKind } from "@/lib/briefing/schema";

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

const descriptionHint: Record<BriefKind, string> = {
  site: "Conte o que o site precisa ter: páginas, o que você vende ou divulga, cores e estilo.",
  imagens: "Conte quais imagens ou banners você precisa, onde vão ser usados e que texto devem ter.",
  videos: "Conte o que o vídeo precisa mostrar, onde vai ser publicado e a duração aproximada.",
};

export default function BriefingForm({ initialKind }: { initialKind: BriefKind }) {
  const [kind, setKind] = useState<BriefKind>(initialKind);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState("");
  const [deadline, setDeadline] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createServiceBriefAction({ kind, name, whatsapp, email, business, description, references, deadline, website });
      if (result.success) setDone(true);
      else setError(result.error);
    });
  }

  if (done) {
    return (
      <div className="mt-8 flex flex-col gap-3 text-sm text-ink">
        <p role="status" className="text-base font-semibold">Pedido enviado!</p>
        <p>Recebemos o seu briefing e vamos entrar em contato pelo WhatsApp que você informou.</p>
        <Link href="/" className="font-semibold text-navy underline">Voltar para a página inicial</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="kind" className="text-sm font-medium text-ink">O que você precisa?</label>
        <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as BriefKind)} className={inputClass}>
          {BRIEF_KINDS.map((k) => (
            <option key={k} value={k}>{BRIEF_LABEL[k]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Seu nome</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="whatsapp" className="text-sm font-medium text-ink">WhatsApp (com DDD)</label>
        <input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" className={inputClass} placeholder="(19) 99999-9999" autoComplete="tel" />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">E-mail (opcional)</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="business" className="text-sm font-medium text-ink">Nome do seu negócio (opcional)</label>
        <input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">Conte o que você quer</label>
        <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        <p className="mt-1 text-xs text-ink-soft">{descriptionHint[kind]}</p>
      </div>
      <div>
        <label htmlFor="references" className="text-sm font-medium text-ink">Referências (opcional)</label>
        <textarea id="references" rows={2} value={references} onChange={(e) => setReferences(e.target.value)} className={inputClass} placeholder="Links de sites, perfis ou exemplos que você gosta" />
      </div>
      <div>
        <label htmlFor="deadline" className="text-sm font-medium text-ink">Prazo desejado (opcional)</label>
        <input id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} placeholder="Ex.: até o fim do mês" />
      </div>

      {/* Campo isca contra robôs: fica fora da tela e ninguém deve preencher. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      <Button type="button" onClick={handleSubmit} disabled={isPending || !name || !whatsapp || !description}>
        {isPending ? "Enviando..." : "Enviar pedido"}
      </Button>
    </div>
  );
}
