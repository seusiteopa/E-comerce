"use client";

import { ProductVariation } from "@/types";

export default function VariationPicker({
  variations,
  selectedId,
  onSelect,
}: {
  variations: ProductVariation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Assume um único atributo por enquanto (ex: "tamanho") — suficiente para o catálogo mock
  const attributeName = Object.keys(variations[0]?.attributes ?? {})[0];
  if (!attributeName) return null;

  return (
    <fieldset>
      <legend className="font-mono-label text-xs uppercase text-ink-soft">
        {attributeName === "tamanho" ? "Tamanho" : attributeName}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
        {variations.map((variation) => {
          const isSelected = variation.id === selectedId;
          const isOut = variation.stock === 0;
          return (
            <button
              key={variation.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isOut}
              onClick={() => onSelect(variation.id)}
              className={`min-w-12 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isOut
                  ? "cursor-not-allowed border-line text-ink-soft/40 line-through"
                  : isSelected
                    ? "border-navy bg-navy text-white"
                    : "border-line text-ink hover:border-navy/40"
              }`}
            >
              {variation.attributes[attributeName]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
