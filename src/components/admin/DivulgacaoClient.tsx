"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { createBriefAction, createCampaignAction, deleteBriefAction } from "@/actions/admin/divulgacao";

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

export default function DivulgacaoClient({
  products,
  briefs,
}: {
  products: { id: string; name: string }[];
  briefs: { id: string; title: string; format: string; audience: string; tone: string }[];
}) {
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [format, setFormat] = useState("post");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const r = await createBriefAction({ title, productId, audience, tone, format, notes });
            if (r.success) {
              setTitle(""); setAudience(""); setTone(""); setNotes("");
              setMessage("Briefing salvo.");
            } else {
              setMessage(r.error);
            }
          });
        }}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
      >
        <h2 className="text-base font-semibold text-ink">Novo briefing</h2>
        <div>
          <label htmlFor="title" className="text-sm font-medium text-ink">O que divulgar</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="product" className="text-sm font-medium text-ink">Produto (opcional)</label>
          <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
            <option value="">Sem produto específico</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="audience" className="text-sm font-medium text-ink">Para quem</label>
          <input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={inputClass} placeholder="Ex.: pessoas que querem empreender" />
        </div>
        <div>
          <label htmlFor="tone" className="text-sm font-medium text-ink">Tom</label>
          <input id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass} placeholder="Ex.: direto e motivador" />
        </div>
        <div>
          <label htmlFor="format" className="text-sm font-medium text-ink">Formato</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
            <option value="post">Post</option>
            <option value="story">Story</option>
            <option value="anuncio">Anúncio</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="text-sm font-medium text-ink">Observações</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar briefing"}</Button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink">Briefings</h2>
        {briefs.length === 0 && <p className="text-sm text-ink-soft">Nenhum briefing ainda.</p>}
        {briefs.map((b) => (
          <BriefRow key={b.id} brief={b} />
        ))}
      </section>
    </div>
  );
}

function BriefRow({ brief }: { brief: { id: string; title: string; format: string; audience: string; tone: string } }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <p className="font-semibold text-ink">{brief.title}</p>
      <p className="text-xs text-ink-soft">
        {brief.format} {brief.audience ? `· ${brief.audience}` : ""} {brief.tone ? `· ${brief.tone}` : ""}
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const r = await createCampaignAction(brief.id);
            setStatus(r.success ? "Campanha gerada." : r.error);
          })}
          className="text-xs font-semibold text-navy hover:underline"
        >
          Gerar campanha de texto
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const r = await deleteBriefAction(brief.id);
            setStatus(r.success ? "Briefing excluído." : r.error);
          })}
          className="text-xs font-semibold text-status-danger hover:underline"
        >
          Excluir
        </button>
      </div>
      {status && <p role="status" className="text-xs text-ink-soft">{status}</p>}
    </div>
  );
}
