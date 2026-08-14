"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";

interface ShippingOptionResponse {
  method: "pac" | "sedex";
  price: number;
  estimatedDays: number;
}

const methodLabels: Record<string, string> = { pac: "PAC", sedex: "SEDEX" };

/**
 * Conectado à rota real /api/frete (Etapa 10) — sem valor simulado.
 * Peso/dimensões por item ainda usam um valor padrão (500g, 20x10x30cm)
 * até que `product_variations.weight_grams` seja preenchido no cadastro
 * real de produto — mesma limitação já documentada em src/actions/checkout.ts.
 */
export default function ShippingStep({
  onContinue,
  onBack,
}: {
  onContinue: (shippingPrice: number, method: string) => void;
  onBack: () => void;
}) {
  const { items } = useCart();
  const [options, setOptions] = useState<ShippingOptionResponse[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const physicalItems = items.filter((i) => i.type === "fisico");
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zipCode: sessionStorage.getItem("checkout_zip") ?? "",
        items: physicalItems.map((i) => ({
          weightGrams: 500,
          widthCm: 20,
          heightCm: 10,
          lengthCm: 30,
          quantity: i.quantity,
        })),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Não foi possível calcular o frete.");
        }
        return res.json();
      })
      .then((data) => {
        setOptions(data.options);
        setSelected(data.options[0]?.method ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Escolha o frete</h2>

      {loading && <p className="mt-4 text-sm text-ink-soft">Calculando frete com os Correios...</p>}

      {error && (
        <p role="alert" className="mt-4 text-sm text-status-danger">
          {error} — tente novamente em instantes.
        </p>
      )}

      {options && (
        <div role="radiogroup" aria-label="Opções de frete" className="mt-5 flex flex-col gap-3">
          {options.map((option) => (
            <label
              key={option.method}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                selected === option.method ? "border-navy bg-navy/5" : "border-line"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="frete"
                  checked={selected === option.method}
                  onChange={() => setSelected(option.method)}
                  className="h-4 w-4 accent-[#173F82]"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{methodLabels[option.method]}</span>
                  <span className="block text-xs text-ink-soft">{option.estimatedDays} dias úteis</span>
                </span>
              </span>
              <span className="text-sm font-semibold text-ink">{formatCurrency(option.price)}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!selected || !options}
          onClick={() => {
            const chosen = options?.find((o) => o.method === selected);
            if (chosen) onContinue(chosen.price, chosen.method);
          }}
        >
          Continuar para o pagamento
        </Button>
      </div>
    </div>
  );
}
