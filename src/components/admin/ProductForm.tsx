"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createProductAction } from "@/actions/admin/produtos";
import { CategoryRow } from "@/types/database";

export default function ProductForm({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("fisico");
  const [isQuoteOnly, setIsQuoteOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProductAction(formData);
      if (result.success) {
        router.push("/admin/produtos");
      } else {
        setError(result.error);
      }
    });
  }

  const filteredCategories = categories.filter((c) => c.product_type === type);

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Nome do produto</label>
        <input id="name" name="name" type="text" required className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="text-sm font-medium text-ink">Tipo</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          >
            <option value="fisico">Físico</option>
            <option value="digital">Digital</option>
            <option value="curso">Curso</option>
            <option value="servico">Serviço</option>
          </select>
        </div>
        <div>
          <label htmlFor="categorySlug" className="text-sm font-medium text-ink">Categoria</label>
          <select id="categorySlug" name="categorySlug" required className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy">
            {filteredCategories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="shortDescription" className="text-sm font-medium text-ink">Descrição curta</label>
        <input id="shortDescription" name="shortDescription" type="text" maxLength={200} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">Descrição completa</label>
        <textarea id="description" name="description" required rows={4} className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="text-sm font-medium text-ink">Preço (R$)</label>
          <input id="price" name="price" type="number" step="0.01" min="0" required className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
        <div>
          <label htmlFor="promoPrice" className="text-sm font-medium text-ink">Preço promocional (opcional)</label>
          <input id="promoPrice" name="promoPrice" type="number" step="0.01" min="0" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
         <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="featured" className="h-4 w-4 accent-[#173F82]" />
          Produto em destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="hidden" className="h-4 w-4 accent-[#173F82]" />
          Produto exclusivo (link único, não aparece na loja)
        </label>
        {type === "servico" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="isQuoteOnly"
              checked={isQuoteOnly}
              onChange={(e) => setIsQuoteOnly(e.target.checked)}
              className="h-4 w-4 accent-[#173F82]"
            />
            Sob orçamento (sem preço fechado)
          </label>
        )}
      </div>

      <div>
        <label htmlFor="status" className="text-sm font-medium text-ink">Status</label>
        <select id="status" name="status" defaultValue="rascunho" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy">
          <option value="rascunho">Rascunho</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar produto"}
      </Button>

      <p className="text-xs text-ink-soft">
        Imagens, variações, arquivo digital e vínculo de curso são adicionados depois de criar o produto (edição).
      </p>
    </form>
  );
}
