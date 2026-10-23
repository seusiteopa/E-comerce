"use client";

import { useState, useTransition } from "react";
import { updateDeliveryAction } from "@/actions/admin/entrega";
import Button from "@/components/ui/Button";

export default function DeliveryForm({ scope, baseCity, cities }: { scope: "local" | "brasil"; baseCity: string | null; cities: string[] }) {
  const [currentScope, setCurrentScope] = useState<"local" | "brasil">(scope);
  const [city, setCity] = useState(baseCity ?? "");
  const [others, setOthers] = useState(cities.join(", "));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDeliveryAction({
        scope: currentScope,
        baseCity: city,
        cities: others.split(",").map((c) => c.trim()).filter(Boolean),
      });
      setMessage(result.success ? "Entrega salva. O aviso já aparece para os clientes." : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Onde a loja entrega?</legend>
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="radio" name="escopo" checked={currentScope === "brasil"} onChange={() => setCurrentScope("brasil")} className="mt-1" />
          <span className="text-sm"><span className="font-semibold">Brasil todo</span><br /><span className="text-ink-soft">Envia para qualquer cidade do país.</span></span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="radio" name="escopo" checked={currentScope === "local"} onChange={() => setCurrentScope("local")} className="mt-1" />
          <span className="text-sm"><span className="font-semibold">Somente a região</span><br /><span className="text-ink-soft">Restaurante ou loja que entrega só na cidade e região.</span></span>
        </label>
      </fieldset>

      {currentScope === "local" && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="cidade-base" className="text-sm font-medium text-ink">Cidade-base</label>
            <input id="cidade-base" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Holton" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="outras-cidades" className="text-sm font-medium text-ink">Outras cidades atendidas (opcional)</label>
            <input id="outras-cidades" value={others} onChange={(e) => setOthers(e.target.value)} placeholder="Ex.: Pentwater, Ludington" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
            <p className="text-xs text-ink-soft">Separe as cidades por vírgula.</p>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar entrega"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
