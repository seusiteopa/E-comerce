"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction, toggleCategoryActiveAction } from "@/actions/admin/categorias";

export default function CategoryRowActions({ slug, name, active }: { slug: string; name: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Excluir a categoria "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(slug);
      if (result.success) router.refresh();
      else alert(result.error);
    });
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCategoryActiveAction(slug, !active);
      if (result.success) router.refresh();
      else alert(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={handleToggle} disabled={isPending} className="text-xs font-semibold text-navy hover:underline disabled:opacity-50">
        {active ? "Desativar" : "Ativar"}
      </button>
      <button type="button" onClick={handleDelete} disabled={isPending} className="text-xs font-semibold text-status-danger hover:underline disabled:opacity-50">
        Excluir
      </button>
    </div>
  );
}
