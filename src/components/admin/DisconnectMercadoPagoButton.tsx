"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { disconnectMercadoPagoAction } from "@/actions/admin/loja";

export default function DisconnectMercadoPagoButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Desconectar o Mercado Pago? A loja deixa de receber pagamentos online até conectar de novo.")) return;
    startTransition(async () => {
      const result = await disconnectMercadoPagoAction();
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div>
      <Button type="button" variant="danger" onClick={handleClick} disabled={isPending}>
        {isPending ? "Desconectando..." : "Desconectar"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-status-danger">{error}</p>}
    </div>
  );
}
