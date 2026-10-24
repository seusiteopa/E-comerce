"use client";

import { useState, useTransition } from "react";
import { createPartnerAction, setPartnerStatusAction, linkStoreToPartnerAction } from "@/actions/plataforma/parceiros";
import Button from "@/components/ui/Button";

type P = { id: string; name: string; status: string };
type S = { id: string; name: string; partner_id: string | null };

export default function PartnersAdmin({ partners, stores }: { partners: P[]; stores: S[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    setMessage(null);
    startTransition(async () => {
      const r = await task();
      setMessage(r.success ? ok : (r.error ?? "Não foi possível concluir."));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Nova agência</h2>
        <p className="text-sm text-ink-soft">Informe o nome da agência e o e-mail de quem já tem conta na Vecorion.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da agência" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail do responsável" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" />
        <Button type="button" disabled={pending || !name || !email} onClick={() => run(() => createPartnerAction({ name, ownerEmail: email }), "Agência cadastrada.")}>Cadastrar agência</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Agências</h2>
        {partners.length === 0 && <p className="text-sm text-ink-soft">Nenhuma agência cadastrada.</p>}
        {partners.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <span className="text-sm text-ink">{p.name} <span className="text-ink-soft">({p.status})</span></span>
            <Button type="button" disabled={pending} onClick={() => run(() => setPartnerStatusAction(p.id, p.status === "ativo" ? "suspenso" : "ativo"), "Situação alterada.")}>
              {p.status === "ativo" ? "Suspender" : "Reativar"}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Vincular loja a uma agência</h2>
        {stores.map((s) => (
          <LinkRow key={s.id} store={s} partners={partners} onDone={(m) => setMessage(m)} />
        ))}
      </div>

      {message && <p role="status" className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}

function LinkRow({ store, partners, onDone }: { store: S; partners: P[]; onDone: (m: string) => void }) {
  const [partnerId, setPartnerId] = useState(store.partner_id ?? "");
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <span className="min-w-40 text-sm text-ink">{store.name}</span>
      <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
        <option value="">Sem agência</option>
        {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <Button type="button" disabled={pending} onClick={() => startTransition(async () => {
        const r = await linkStoreToPartnerAction(store.id, partnerId || null);
        onDone(r.success ? "Vínculo salvo." : (r.error ?? "Não foi possível salvar."));
      })}>Salvar</Button>
    </div>
  );
}
