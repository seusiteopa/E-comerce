"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStoreStatusAction, setBillingStatusAction } from "@/actions/plataforma";

export default function PlatformStoreActions({
  storeId,
  status,
  billingStatus,
  isPlatformOwned,
}: {
  storeId: string;
  status: "ativa" | "pausada";
  billingStatus: "em_dia" | "atrasada";
  isPlatformOwned: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
      else setError(result.error ?? "Erro.");
    });
  }

  const btn = "rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white disabled:opacity-50";

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {!isPlatformOwned &&
          (status === "ativa" ? (
            <button
              type="button"
              className={btn}
              disabled={isPending}
              onClick={() => window.confirm("Pausar esta loja? Ela deixa de aceitar pedidos.") && run(() => setStoreStatusAction(storeId, "pausada"))}
            >
              Pausar loja
            </button>
          ) : (
            <button type="button" className={btn} disabled={isPending} onClick={() => run(() => setStoreStatusAction(storeId, "ativa"))}>
              Liberar loja
            </button>
          ))}
        {!isPlatformOwned && (
          <button
            type="button"
            className={btn}
            disabled={isPending}
            onClick={() => run(() => setBillingStatusAction(storeId, billingStatus === "em_dia" ? "atrasada" : "em_dia"))}
          >
            {billingStatus === "em_dia" ? "Marcar atrasada" : "Marcar em dia"}
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
