"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProductStatusAction } from "@/actions/admin/produtos";

type Status = "ativo" | "inativo" | "rascunho";
const LABEL: Record<Status, string> = { ativo: "Ativo", inativo: "Inativo", rascunho: "Rascunho" };

export default function ProductStatusSelect({ productId, status }: { productId: string; status: Status }) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Status) {
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await updateProductStatusAction(productId, next);
      if (result.success) {
        router.refresh();
      } else {
        setCurrent(previous);
        alert(result.error);
      }
    });
  }

  return (
    <select
      aria-label="Situação do produto"
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Status)}
      className="rounded-lg border border-line bg-surface px-2 py-1 text-xs disabled:opacity-50"
    >
      {(Object.keys(LABEL) as Status[]).map((s) => (
        <option key={s} value={s}>{LABEL[s]}</option>
      ))}
    </select>
  );
}
