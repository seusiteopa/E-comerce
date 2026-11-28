"use client";

import { useState, useTransition } from "react";
import { updateBriefStatusAction } from "@/actions/plataforma/briefings";
import { deleteBriefAction } from "@/actions/plataforma/exclusoes";
import { BRIEF_STATUS, BRIEF_STATUS_LABEL, type BriefStatus } from "@/lib/briefing/schema";

export type BriefRow = {
  id: string;
  kindLabel: string;
  name: string;
  whatsapp: string;
  whatsappUrl: string;
  email: string | null;
  business: string | null;
  description: string;
  references_text: string | null;
  deadline: string | null;
  status: BriefStatus;
  created_at: string;
};

export default function BriefingsList({ briefs }: { briefs: BriefRow[] }) {
  const [rows, setRows] = useState(briefs);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: BriefStatus) {
    setMessage(null);
    startTransition(async () => {
      const r = await updateBriefStatusAction(id, status);
      if (r.success) setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      else setMessage(r.error);
    });
  }

  function remove(id: string) {
    if (!window.confirm("Excluir este pedido de serviço?")) return;
    setMessage(null);
    startTransition(async () => {
      const r = await deleteBriefAction(id);
      if (r.success) setRows((prev) => prev.filter((x) => x.id !== id));
      else setMessage(r.error);
    });
  }

  if (rows.length === 0) return <p className="text-sm text-ink-soft">Nenhum pedido de serviço ainda.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {r.kindLabel} <span className="font-normal text-ink-soft">· {r.name}{r.business ? ` (${r.business})` : ""}</span>
            </p>
            <select
              aria-label="Situação do pedido"
              value={r.status}
              disabled={pending}
              onChange={(e) => changeStatus(r.id, e.target.value as BriefStatus)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
            >
              {BRIEF_STATUS.map((s) => (
                <option key={s} value={s}>{BRIEF_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-ink-soft">
            {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            {r.deadline ? ` · prazo: ${r.deadline}` : ""}
          </p>
          <p className="whitespace-pre-line text-sm text-ink">{r.description}</p>
          {r.references_text && <p className="whitespace-pre-line text-xs text-ink-soft">Referências: {r.references_text}</p>}
          <p className="text-sm">
            <a href={`/plataforma/briefings/${r.id}`} className="mr-3 font-semibold text-navy underline">Abrir entrega</a>
            <a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline">Chamar no WhatsApp</a>
            <span className="text-ink-soft"> · {r.whatsapp}{r.email ? ` · ${r.email}` : ""}</span>
            <button type="button" onClick={() => remove(r.id)} disabled={pending} className="ml-3 text-xs font-semibold text-status-danger hover:underline disabled:opacity-50">Excluir</button>
          </p>
        </div>
      ))}
      {message && <p role="status" className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
