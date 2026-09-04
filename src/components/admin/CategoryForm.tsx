"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createCategoryAction } from "@/actions/admin/categorias";

export default function CategoryForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (result.success) {
        router.refresh();
        const form = document.getElementById("category-form") as HTMLFormElement | null;
        form?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form id="category-form" action={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Nome da categoria</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Ex: Camisetas"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />
      </div>

      <div>
        <label htmlFor="productType" className="text-sm font-medium text-ink">Tipo de produto</label>
        <select
          id="productType"
          name="productType"
          defaultValue="fisico"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        >
          <option value="fisico">Físico</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">Descrição (opcional)</label>
        <input
          id="description"
          name="description"
          type="text"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />
      </div>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Criando..." : "Criar categoria"}
      </Button>
    </form>
  );
}
