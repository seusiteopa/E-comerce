"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { setProductFeaturedAction } from "@/actions/admin/destaque-produto";

/** Estrela para destacar o produto na página inicial. O destaque só aparece se o produto estiver Ativo. */
export default function ProductFeaturedToggle({ productId, featured, status }: { productId: string; featured: boolean; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(featured);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !current;
    setCurrent(next);
    startTransition(async () => {
      const result = await setProductFeaturedAction(productId, next);
      if (result.success) {
        router.refresh();
      } else {
        setCurrent(!next);
        alert(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={current}
        aria-label={current ? "Tirar dos destaques" : "Colocar nos destaques"}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper disabled:opacity-50"
      >
        <Star size={14} aria-hidden="true" className={current ? "fill-farol text-farol-deep" : "text-ink-soft"} />
        {current ? "Em destaque" : "Destacar"}
      </button>
      {current && status !== "ativo" && <span className="text-[11px] text-status-warning">Só aparece com o produto Ativo.</span>}
    </div>
  );
}
