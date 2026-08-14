"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import { createOrderAction } from "@/actions/checkout";

const methods = [
  { id: "pix", label: "Pix", description: "Aprovação imediata" },
  { id: "cartao", label: "Cartão de crédito", description: "Em até 12x" },
  { id: "boleto", label: "Boleto", description: "Compensação em até 2 dias úteis" },
];

interface PaymentStepProps {
  onBack: () => void;
  addressId?: string;
  shippingMethod?: string;
}

/**
 * Conectado à Server Action real (Etapa 9/10): cria o pedido no Supabase,
 * gera a preferência de pagamento no Mercado Pago e redireciona o
 * cliente para o checkout real do Mercado Pago — não existe mais
 * confirmação simulada aqui.
 */
export default function PaymentStep({ onBack, addressId, shippingMethod }: PaymentStepProps) {
  const { items, clearCart } = useCart();
  const [selected, setSelected] = useState(methods[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const result = await createOrderAction({
      items: items.map((i) => ({
        productId: i.productId,
        variationId: i.variationId,
        quantity: i.quantity,
      })),
      addressId,
      shippingMethod,
    });

    if (result.success) {
      clearCart();
      window.location.href = result.data.checkoutUrl;
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Forma de pagamento</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Você será redirecionado ao ambiente seguro do Mercado Pago para concluir o pagamento.
      </p>
      <div role="radiogroup" aria-label="Formas de pagamento" className="mt-5 flex flex-col gap-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
              selected === method.id ? "border-navy bg-navy/5" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              checked={selected === method.id}
              onChange={() => setSelected(method.id)}
              className="h-4 w-4 accent-[#173F82]"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{method.label}</span>
              <span className="block text-xs text-ink-soft">{method.description}</span>
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-status-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button type="button" className="flex-1" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Processando..." : "Finalizar pedido"}
        </Button>
      </div>
    </div>
  );
}
