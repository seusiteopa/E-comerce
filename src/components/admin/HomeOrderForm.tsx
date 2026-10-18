"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { HOME_SECTION_LABELS, type HomeSection } from "@/lib/store/home-order";
import { updateHomeOrderAction } from "@/actions/admin/loja";

export default function HomeOrderForm({ initial }: { initial: HomeSection[] }) {
  const [order, setOrder] = useState<HomeSection[]>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await updateHomeOrderAction(order);
          setMessage(result.success ? "Ordem da página inicial salva." : result.error);
        });
      }}
      className="mt-10 flex flex-col gap-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-ink">Ordem da página inicial</h2>
        <p className="mt-1 text-sm text-ink-soft">Escolha a sequência dos blocos na sua vitrine.</p>
      </div>
      <ol className="flex flex-col gap-2">
        {order.map((key, index) => (
          <li key={key} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
            <span className="text-sm font-medium text-ink">{index + 1}. {HOME_SECTION_LABELS[key]}</span>
            <span className="flex gap-2">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg border border-line px-3 py-1 text-sm disabled:opacity-40" aria-label="Subir">↑</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === order.length - 1} className="rounded-lg border border-line px-3 py-1 text-sm disabled:opacity-40" aria-label="Descer">↓</button>
            </span>
          </li>
        ))}
      </ol>
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar ordem"}</Button>
    </form>
  );
}
