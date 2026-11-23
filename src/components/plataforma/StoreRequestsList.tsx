"use client";

import { useState, useTransition } from "react";
import { aprovarExclusaoAction, recusarPedidoAction, reativarLojaPlataformaAction } from "@/actions/plataforma/pedidos";
import Button from "@/components/ui/Button";

type Req = { id: string; store_id: string; store_name: string; kind: string; status: string; note: string | null; created_at: string; owner: string };

export default function StoreRequestsList({ requests }: { requests: Req[] }) {
  const [rows, setRows] = useState(requests);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(task: () => Promise<{ success: boolean; error?: string }>, id: string, ok: string) {
    setMessage(null);
    startTransition(async () => {
      const r = await task();
      if (r.success) {
        setRows((prev) => prev.filter((x) => x.id !== id));
        setMessage(ok);
      } else {
        setMessage(r.error ?? "Não foi possível concluir.");
      }
    });
  }

  if (rows.length === 0) return <p className="text-sm text-ink-soft">Nenhum pedido pendente.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">{r.store_name} <span className="text-ink-soft">({r.owner})</span></p>
          <p className="text-xs text-ink-soft">Pedido: {r.kind === "exclusao" ? "excluir a loja" : "encerrar a loja"} · {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          {r.note && <p className="text-sm text-ink">Motivo: {r.note}</p>}
          {r.kind === "exclusao" && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={pending} onClick={() => act(() => aprovarExclusaoAction(r.id), r.id, "Loja excluída.")}>Aprovar exclusão</Button>
              <Button type="button" disabled={pending} onClick={() => act(() => recusarPedidoAction(r.id), r.id, "Pedido recusado.")}>Recusar</Button>
            </div>
          )}
        </div>
      ))}
      {message && <p role="status" className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
