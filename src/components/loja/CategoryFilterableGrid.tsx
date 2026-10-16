"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/loja/ProductGrid";
import { Product } from "@/types";

interface CategoryOption {
  slug: string;
  name: string;
}

/**
 * Lista "Todos os produtos" com abas de categoria ao lado do título —
 * clicar numa categoria filtra a lista abaixo, sem sair da página
 * (filtragem no navegador, os produtos já vieram todos carregados).
 */
export default function CategoryFilterableGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: CategoryOption[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // Só mostra categorias que realmente têm produto ativo na lista — não
  // faz sentido oferecer uma aba vazia.
  const availableCategories = useMemo(() => {
    const slugsWithProducts = new Set(products.map((p) => p.categorySlug));
    return categories.filter((c) => slugsWithProducts.has(c.slug));
  }, [products, categories]);

  const filtered = useMemo(() => {
    if (!selected) return products;
    return products.filter((p) => p.categorySlug === selected);
  }, [products, selected]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">Todos os produtos</h2>

        {availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selected === null ? "bg-navy text-white" : "border border-line text-ink-soft hover:border-navy"
              }`}
            >
              Todas
            </button>
            {availableCategories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSelected(c.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selected === c.slug ? "bg-navy text-white" : "border border-line text-ink-soft hover:border-navy"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ProductGrid products={filtered} />
      </div>
    </>
  );
}
