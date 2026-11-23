"use client";

import type { SelectableGroup } from "@/lib/produto/opcoes";
import { formatCurrency } from "@/lib/format";

/** Escolha das opções do produto (tamanho, cor, adicionais, remover ingredientes). */
export default function ProductOptionsPicker({
  groups,
  selectedIds,
  onChange,
}: {
  groups: SelectableGroup[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(group: SelectableGroup, optionId: string) {
    const groupIds = group.options.map((o) => o.id);
    const without = selectedIds.filter((id) => !groupIds.includes(id));
    if (group.max_choices === 1) {
      onChange([...without, optionId]);
      return;
    }
    const current = selectedIds.filter((id) => groupIds.includes(id));
    if (current.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else if (group.max_choices === null || current.length < group.max_choices) {
      onChange([...selectedIds, optionId]);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const groupIds = g.options.map((o) => o.id);
        const single = g.max_choices === 1;
        return (
          <fieldset key={g.id} className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-ink">
              {g.name}
              {g.required && <span className="ml-2 text-xs font-normal text-status-danger">obrigatório</span>}
              {!single && g.max_choices !== null && <span className="ml-2 text-xs font-normal text-ink-soft">até {g.max_choices}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const checked = selectedIds.includes(o.id);
                const limitReached = !single && g.max_choices !== null && !checked && selectedIds.filter((id) => groupIds.includes(id)).length >= g.max_choices;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm ${checked ? "border-navy bg-navy/5 text-ink" : "border-line text-ink"} ${limitReached ? "opacity-50" : ""}`}
                  >
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={g.id}
                      className="sr-only"
                      checked={checked}
                      disabled={limitReached}
                      onChange={() => toggle(g, o.id)}
                    />
                    {o.name}
                    {o.extra_price > 0 && <span className="text-xs text-ink-soft">+ {formatCurrency(o.extra_price)}</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
