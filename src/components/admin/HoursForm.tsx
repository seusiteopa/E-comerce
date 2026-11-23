"use client";

import { useState, useTransition } from "react";
import { saveStoreHoursAction } from "@/actions/admin/horario";
import Button from "@/components/ui/Button";

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type Row = { weekday: number; closed: boolean; opens_at: string; closes_at: string };

export default function HoursForm({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(weekday: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const payload = rows.map((r) => ({
        weekday: r.weekday,
        closed: r.closed,
        opens_at: r.closed ? null : r.opens_at,
        closes_at: r.closed ? null : r.closes_at,
      }));
      const result = await saveStoreHoursAction({ rows: payload });
      setMessage(result.success ? "Horário salvo." : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Defina quando a loja aceita pedidos. Fora do horário, a vitrine mostra <strong>Fechado agora</strong>, e o cliente não consegue finalizar a compra. Se nenhum horário for salvo, a loja fica aberta sempre.
      </p>
      {rows.map((r) => (
        <div key={r.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <span className="w-40 text-sm font-medium text-ink">{DAYS[r.weekday]}</span>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={r.closed} onChange={(e) => update(r.weekday, { closed: e.target.checked })} />
            Fechado
          </label>
          {!r.closed && (
            <>
              <label className="flex items-center gap-2 text-sm text-ink">
                Abre
                <input type="time" value={r.opens_at} onChange={(e) => update(r.weekday, { opens_at: e.target.value })} className="rounded-lg border border-line bg-surface px-2 py-1" />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                Fecha
                <input type="time" value={r.closes_at} onChange={(e) => update(r.weekday, { closes_at: e.target.value })} className="rounded-lg border border-line bg-surface px-2 py-1" />
              </label>
            </>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar horário"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
