"use client";

import { useState, useTransition } from "react";
import { openSetupInvoiceAction } from "@/actions/plataforma/implantacao";
import Button from "@/components/ui/Button";

export default function OpenSetupForm({ stores }: { stores: { id: string; name: string }[] }) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [productCount, setProductCount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await openSetupInvoiceAction({ storeId, productCount });
      setMessage(result.success ? "Cobrança de criação assistida aberta. Ela aparece na tela de Pagamentos da loja." : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold text-ink">Abrir criação assistida</h2>
      <p className="text-sm text-ink-soft">Taxa única: até 20 produtos R$ 300 · 21 a 60 R$ 600 · 61 a 150 R$ 1.000.</p>
      <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        value={productCount}
        onChange={(e) => setProductCount(e.target.value)}
        placeholder="Quantidade de produtos"
        className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending || !storeId || productCount === ""}>
          {pending ? "Abrindo..." : "Abrir cobrança"}
        </Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
