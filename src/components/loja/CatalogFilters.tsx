"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Product, ProductType } from "@/types";
import ProductGrid from "@/components/loja/ProductGrid";

const typeOptions: { value: ProductType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "fisico", label: "Físico" },
  { value: "digital", label: "Digital" },
];

const sortOptions = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

export default function CatalogFilters({ products }: { products: Product[] }) {
  const [type, setType] = useState<ProductType | "todos">("todos");
  const [sort, setSort] = useState("relevancia");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = type === "todos" ? products : products.filter((p) => p.type === type);
    list = [...list];
    if (sort === "menor-preco") list.sort((a, b) => (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price));
    if (sort === "maior-preco") list.sort((a, b) => (b.promoPrice ?? b.price) - (a.promoPrice ?? a.price));
    return list;
  }, [products, type, sort]);

  const filterControls = (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-mono-label text-xs uppercase text-ink-soft">Tipo</h2>
        <div className="mt-3 flex flex-col gap-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              aria-pressed={type === opt.value}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                type === opt.value ? "bg-navy text-white" : "text-ink-soft hover:bg-paper"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="sort" className="font-mono-label text-xs uppercase text-ink-soft">
          Ordenar por
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* Filtro desktop: barra lateral fixa */}
      <aside className="hidden lg:block">{filterControls}</aside>

      {/* Filtro mobile: gaveta deslizante (Etapa 5) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtrar e ordenar
        </button>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
            <div role="dialog" aria-label="Filtros" className="relative ml-auto flex h-full w-72 flex-col gap-6 overflow-y-auto bg-surface p-6">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar filtros"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-line"
              >
                <X size={16} aria-hidden="true" />
              </button>
              {filterControls}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-4 text-sm text-ink-soft">
          {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
        <ProductGrid products={filtered} />
      </div>
    </div>
  );
}
