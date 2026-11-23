"use client";

import { useState, useTransition } from "react";
import { encerrarLojaAction, reativarLojaAction, solicitarExclusaoAction } from "@/actions/situacao/loja";
import Button from "@/components/ui/Button";

export default function StoreStatusControls({ status, hasPendingExclusion }: { status: string; hasPendingExclusion: boolean }) {
  const [current, setCurrent] = useState(status);
  const [pendingExclusion, setPendingExclusion] = useState(hasPendingExclusion);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok: string, after?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const r = await task();
      if (r.success) {
        setMessage(ok);
        after?.();
      } else {
        setMessage(r.error ?? "Não foi possível concluir.");
      }
    });
  }

  const encerrada = current === "encerrada";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink">
        Situação atual: <strong>{encerrada ? "Encerrada" : "Ativa"}</strong>
      </p>

      {encerrada ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-soft">A loja está fora da vitrine e não aceita pedidos. Os dados continuam guardados.</p>
          <Button type="button" disabled={pending} onClick={() => run(() => reativarLojaAction(), "Loja reativada.", () => setCurrent("ativa"))}>
            Reativar loja
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-soft">Encerrar tira a loja da vitrine e impede novos pedidos. Você pode reativar quando quiser. A plataforma é avisada.</p>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Encerrar a loja? Ela sai da vitrine e não aceita pedidos até você reativar.")) {
                run(() => encerrarLojaAction(), "Loja encerrada.", () => setCurrent("encerrada"));
              }
            }}
          >
            Encerrar loja
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <p className="text-sm font-medium text-ink">Excluir a loja</p>
        {pendingExclusion ? (
          <p className="text-sm text-ink-soft">Seu pedido de exclusão está em análise pela plataforma.</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">A exclusão só acontece depois que a plataforma aprovar. Explique o motivo, se quiser.</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm" placeholder="Motivo (opcional)" />
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm("Pedir a exclusão da loja? Ela só será apagada depois da análise da plataforma.")) {
                  run(() => solicitarExclusaoAction({ note }), "Pedido enviado para análise.", () => setPendingExclusion(true));
                }
              }}
            >
              Pedir exclusão
            </Button>
          </>
        )}
      </div>

      {message && <p role="status" className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
