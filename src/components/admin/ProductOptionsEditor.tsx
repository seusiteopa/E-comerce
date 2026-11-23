"use client";

import { useState, useTransition } from "react";
import { saveProductOptionsAction } from "@/actions/admin/opcoes";
import Button from "@/components/ui/Button";
import type { SavedGroup } from "@/lib/produto/opcoes-data";

type Group = SavedGroup;
const field = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const emptyGroup = (): Group => ({ name: "", mode: "escolha", required: false, min_choices: 0, max_choices: 1, options: [{ name: "", extra_price: 0 }] });

export default function ProductOptionsEditor({ productId, initial }: { productId: string; initial: SavedGroup[] }) {
  const [groups, setGroups] = useState<Group[]>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setGroup(gi: number, patch: Partial<Group>) {
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  }
  function setOption(gi: number, oi: number, patch: Partial<{ name: string; extra_price: number }>) {
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g)));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const r = await saveProductOptionsAction({ productId, groups });
      setMessage(r.success ? "Opções salvas." : r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        Crie grupos como <strong>Tamanho</strong>, <strong>Cor</strong>, <strong>Adicionais</strong> ou <strong>Remover ingredientes</strong>. Em &quot;Escolha única&quot;, o cliente escolhe uma opção. Em &quot;Múltipla&quot;, pode escolher várias, até o máximo.
      </p>

      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap gap-2">
            <input className={`${field} flex-1`} placeholder="Nome do grupo (ex.: Tamanho)" value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} />
            <select className={field} value={g.mode} onChange={(e) => setGroup(gi, { mode: e.target.value as Group["mode"], max_choices: e.target.value === "escolha" ? 1 : g.max_choices })}>
              <option value="escolha">Escolha única</option>
              <option value="multipla">Múltipla</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={g.required} onChange={(e) => setGroup(gi, { required: e.target.checked, min_choices: e.target.checked ? Math.max(1, g.min_choices) : g.min_choices })} />
              Obrigatório
            </label>
            {g.mode === "multipla" && (
              <>
                <label className="flex items-center gap-2">
                  Mínimo
                  <input type="number" min={0} className={`${field} w-20`} value={g.min_choices} onChange={(e) => setGroup(gi, { min_choices: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-2">
                  Máximo
                  <input type="number" min={0} className={`${field} w-20`} value={g.max_choices ?? ""} placeholder="sem limite" onChange={(e) => setGroup(gi, { max_choices: e.target.value === "" ? null : Number(e.target.value) })} />
                </label>
              </>
            )}
            <button type="button" className="ml-auto text-xs text-status-danger underline" onClick={() => setGroups((prev) => prev.filter((_, i) => i !== gi))}>
              Remover grupo
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {g.options.map((o, oi) => (
              <div key={oi} className="flex flex-wrap items-center gap-2">
                <input className={`${field} flex-1`} placeholder="Opção (ex.: Preta)" value={o.name} onChange={(e) => setOption(gi, oi, { name: e.target.value })} />
                <input type="number" min={0} step="0.01" className={`${field} w-28`} placeholder="Valor extra" value={o.extra_price} onChange={(e) => setOption(gi, oi, { extra_price: Number(e.target.value) })} />
                <button type="button" className="text-xs text-ink-soft underline" onClick={() => setGroup(gi, { options: g.options.filter((_, j) => j !== oi) })}>remover</button>
              </div>
            ))}
            <button type="button" className="self-start text-xs font-semibold text-navy underline" onClick={() => setGroup(gi, { options: [...g.options, { name: "", extra_price: 0 }] })}>
              + Adicionar opção
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="self-start text-sm font-semibold text-navy underline" onClick={() => setGroups((prev) => [...prev, emptyGroup()])}>
        + Adicionar grupo de opções
      </button>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar opções"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
