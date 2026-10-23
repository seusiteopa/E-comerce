"use client";

import { useState, useTransition } from "react";
import { setSponsorshipAction } from "@/actions/admin/destaque";
import Button from "@/components/ui/Button";

export default function DestaqueToggle({ active }: { active: boolean }) {
  const [isActive, setIsActive] = useState(active);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setMessage(null);
    startTransition(async () => {
      const result = await setSponsorshipAction(!isActive);
      if (result.success) {
        setIsActive(!isActive);
        setMessage(isActive ? "Destaque pausado." : "Destaque ativado. A cobrança do primeiro mês aparece na tela de Pagamentos.");
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={toggle} disabled={pending}>
        {pending ? "Aguarde..." : isActive ? "Pausar destaque" : "Ativar destaque"}
      </Button>
      <span className="text-sm font-semibold text-ink">{isActive ? "Ativo" : "Desligado"}</span>
      {message && <span role="status" className="w-full text-xs text-ink-soft">{message}</span>}
    </div>
  );
}
