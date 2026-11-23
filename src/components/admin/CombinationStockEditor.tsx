"use client";

import { useState, useTransition } from "react";
import { saveCombinationStockAction } from "@/actions/admin/estoque-combinacoes";
import Button from "@/components/ui/Button";
import { combinationsFromGroups, attrsKey, type Attrs } from "@/lib/produto/combinacoes";

type Group = { name: string; mode: "escolha" | "multipla"; options: { name: string }[] };

export default function CombinationStockEditor({
  productId,
  groups,
  variations,
}: {
  productId: string;
  groups: Group[];
  variations: { attributes: Attrs; stock: number }[];
}) {
  const combos = combinationsFromGroups(groups);
  const initial = new Map(variations.map((v) => [attrsKey(v.attributes), v.stock]));
  const [stocks, setStocks] = useState<Record<string, number>>(() =>
    Object.fromEntries(combos.map((c) => [attrsKey(c), initial.get(attrsKey(c)) ?? 0]))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (combos.length === 1 && Object.keys(combos[0]).length === 0) {
    return <p className="text-sm text-ink-soft">Crie grupos de escolha única (ex.: Cor e Tamanho) para controlar o estoque por combinação.</p>;
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const rows = combos.map((c) => ({ attributes: c, stock: stocks[attrsKey(c)] ?? 0 }));
      const r = await saveCombinationStockAction({ productId, rows });
      setMessage(r.success ? "Estoque salvo." : r.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">Quantidade disponível de cada combinação. Combinação com zero aparece como esgotada.</p>
      <div className="flex flex-col gap-2">
        {combos.map((c) => {
          const key = attrsKey(c);
          const label = Object.entries(c).map(([k, v]) => `${k}: ${v}`).join(" · ");
          return (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="text-sm text-ink">{label}</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border border-line bg-surface px-2 py-1 text-sm"
                value={stocks[key] ?? 0}
                onChange={(e) => setStocks((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar estoque"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
