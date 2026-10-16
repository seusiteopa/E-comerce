"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { getPrintLinkAction } from "@/actions/admin/impressao";

export default function PrintOrderButton({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getPrintLinkAction(orderId);
      if (result.success) window.location.href = result.data.url;
      else setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <Button type="button" variant={compact ? "ghost" : "primary"} className={compact ? "px-3 py-1.5" : ""} onClick={handleClick} disabled={isPending}>
        {isPending ? "Preparando..." : "Imprimir"}
      </Button>
      {error && <span role="alert" className="mt-1 text-xs text-status-danger">{error}</span>}
    </span>
  );
}
