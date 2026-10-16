"use client";

import { useState } from "react";
import { PRODUCT_ICONS } from "@/data/product-icons";

/** Escolha rápida de um ícone pronto (o lojista pode, depois, subir uma foto própria). */
export default function IconPicker({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const categories = [...new Set(PRODUCT_ICONS.map((i) => i.category))];

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Ícone pronto (sem precisar de foto)</p>
          <p className="text-xs text-ink-soft">Escolha um desenho do tipo do produto. Você pode trocar por uma foto própria depois.</p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="shrink-0 text-sm font-semibold text-navy underline">
          {open ? "Fechar" : value ? "Trocar" : "Escolher"}
        </button>
      </div>

      {value && (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Ícone escolhido" className="h-14 w-14 rounded-lg" />
          <button type="button" onClick={() => onChange(null)} className="text-xs text-ink-soft underline">Remover</button>
        </div>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          {categories.map((category) => (
            <div key={category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{category}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {PRODUCT_ICONS.filter((i) => i.category === category).map((icon) => (
                  <button
                    key={icon.slug}
                    type="button"
                    title={icon.name}
                    onClick={() => {
                      onChange(icon.url);
                      setOpen(false);
                    }}
                    className={`rounded-lg border p-1 transition-colors hover:border-navy ${value === icon.url ? "border-navy" : "border-line"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.url} alt={icon.name} className="h-full w-full rounded-md" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
