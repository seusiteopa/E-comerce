"use client";

import { useState, useTransition } from "react";
import { openSetupAsPartnerAction } from "@/actions/parceiro/criacao";
import Button from "@/components/ui/Button";

export default function PartnerSetupForm({ storeId }: { storeId: string }) {
  const [productCount, setProductCount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="number" min={0} value={productCount} onChange={(e) => setProductCount(e.target.value)} placeholder="Nº de produtos" className="w-36 rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
      <Button type="button" disabled={pending || productCount === ""} onClick={() => startTransition(async () => {
        const r = await openSetupAsPartnerAction({ storeId, productCount });
        setMessage(r.success ? "Cobrança aberta. A loja vê o Pix na tela de Pagamentos." : r.error);
      })}>
        {pending ? "Abrindo..." : "Abrir criação assistida"}
      </Button>
      {message && <span role="status" className="w-full text-xs text-ink-soft">{message}</span>}
    </div>
  );
}
