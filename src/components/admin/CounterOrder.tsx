"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { createCounterOrderAction, getCounterOrderPaidAction, type CounterOrderResult } from "@/actions/admin/balcao";
import { formatCurrency } from "@/lib/format";
import PrintOrderButton from "@/components/admin/PrintOrderButton";

export interface CounterProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

type Method = "pix" | "dinheiro" | "cartao";
const methodLabel: Record<Method, string> = { pix: "Pix (QR Code)", dinheiro: "Dinheiro", cartao: "Cartão (maquininha)" };

export default function CounterOrder({ products }: { products: CounterProduct[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [method, setMethod] = useState<Method>("dinheiro");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CounterOrderResult | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const lines = useMemo(
    () => products.filter((p) => cart[p.id]).map((p) => ({ ...p, quantity: cart[p.id] })),
    [products, cart]
  );
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const visible = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  function change(id: string, delta: number) {
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  function reset() {
    setCart({});
    setCustomerName("");
    setResult(null);
    setPaid(false);
    setError(null);
    setCopied(false);
  }

  function handleFinish() {
    setError(null);
    startTransition(async () => {
      const response = await createCounterOrderAction({
        items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
        customerName,
        paymentMethod: method,
      });
      if (!response.success) {
        setError(response.error);
        return;
      }
      setResult(response.data);
      setPaid(response.data.paid);
    });
  }

  // Pix: confere a cada 4 segundos se o pagamento foi confirmado (o aviso chega pelo webhook).
  useEffect(() => {
    if (!result || result.paymentMethod !== "pix" || paid) return;
    const id = setInterval(async () => {
      const response = await getCounterOrderPaidAction(result.orderId);
      if (response.success && response.data.paid) setPaid(true);
    }, 4000);
    return () => clearInterval(id);
  }, [result, paid]);

  if (result) {
    return (
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-sm text-ink-soft">Pedido #{result.orderId.slice(0, 8)} · {formatCurrency(result.total)}</p>
        {result.paymentMethod === "pix" && !paid && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${result.qrCodeBase64}`} alt="QR Code Pix" className="h-56 w-56" />
            <p className="text-sm text-ink">Peça para o cliente pagar. A tela confirma sozinha.</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.qrCode);
                setCopied(true);
              }}
              className="text-sm font-semibold text-navy underline"
            >
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          </>
        )}
        {paid && <p role="status" className="text-lg font-semibold text-ink">Pago ✔</p>}
        <div className="flex flex-wrap justify-center gap-3">
          {paid && <PrintOrderButton orderId={result.orderId} />}
          <Button type="button" variant="secondary" onClick={reset}>Novo pedido</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto"
          className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => change(p.id, 1)}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-center transition-colors hover:border-navy"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <span className="text-sm font-medium text-ink">{p.name}</span>
              <span className="text-xs text-ink-soft">{formatCurrency(p.price)}</span>
              {cart[p.id] ? <span className="text-xs font-semibold text-navy">{cart[p.id]} no pedido</span> : null}
            </button>
          ))}
          {visible.length === 0 && <p className="col-span-full text-sm text-ink-soft">Nenhum produto encontrado.</p>}
        </div>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Pedido</h2>
        {lines.length === 0 && <p className="text-sm text-ink-soft">Toque nos produtos para adicionar.</p>}
        <ul className="flex flex-col gap-2">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">{l.name}</span>
              <span className="flex items-center gap-2">
                <button type="button" aria-label={`Menos ${l.name}`} onClick={() => change(l.id, -1)} className="h-7 w-7 rounded-full border border-line">−</button>
                <span className="w-5 text-center">{l.quantity}</span>
                <button type="button" aria-label={`Mais ${l.name}`} onClick={() => change(l.id, 1)} className="h-7 w-7 rounded-full border border-line">+</button>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line pt-3 text-sm font-semibold text-ink">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nome do cliente (opcional)"
          maxLength={60}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">Pagamento</legend>
          {(Object.keys(methodLabel) as Method[]).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
              {methodLabel[m]}
            </label>
          ))}
          {method === "cartao" && <p className="text-xs text-ink-soft">Cobre na sua maquininha; aqui o pedido só é marcado como pago.</p>}
        </fieldset>

        {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
        <Button type="button" onClick={handleFinish} disabled={isPending || lines.length === 0}>
          {isPending ? "Registrando..." : method === "pix" ? "Gerar Pix" : "Finalizar pedido"}
        </Button>
      </aside>
    </div>
  );
}
