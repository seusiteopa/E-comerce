"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import { createOrderAction, getPixPaymentStatusAction } from "@/actions/checkout";

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

interface PixState {
  orderId: string;
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
}

export default function PaymentStep({ onBack, addressId, shippingMethod }: PaymentStepProps) {
  const { items, clearCart } = useCart();
  const [selected, setSelected] = useState(methods[0].id);
  const [cpf, setCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(paymentId: string, orderId: string) {
    pollRef.current = setInterval(async () => {
      const result = await getPixPaymentStatusAction(paymentId);
      if (result.success && result.data.status === "approved") {
        if (pollRef.current) clearInterval(pollRef.current);
        clearCart();
        window.location.href = `/checkout/confirmacao?pedido=${orderId}`;
      }
    }, 5000);
  }

  async function handleSubmit() {
    setError(null);

    const digitsOnly = cpf.replace(/\D/g, "");
    if (digitsOnly.length !== 11) {
      setError("Informe um CPF válido (11 números) para continuar.");
      return;
    }

    setSubmitting(true);

    const result = await createOrderAction({
      items: items.map((i) => ({
        productId: i.productId,
        variationId: i.variationId,
        quantity: i.quantity,
      })),
      addressId,
      shippingMethod,
      payerDocument: digitsOnly,
      paymentMethod: selected,
    });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result.data.paymentMethod === "pix") {
      setPix({
        orderId: result.data.orderId,
        paymentId: result.data.paymentId,
        qrCodeBase64: result.data.qrCodeBase64,
        qrCode: result.data.qrCode,
      });
      setSubmitting(false);
      startPolling(result.data.paymentId, result.data.orderId);
    } else {
      clearCart();
      window.location.href = result.data.checkoutUrl;
    }
  }

  async function handleCopy() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (pix) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <h2 className="text-sm font-semibold text-ink">Pague com Pix</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Escaneie o QR Code com o app do seu banco, ou copie o código abaixo.
        </p>

        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code Pix"
          className="mx-auto mt-5 h-56 w-56 rounded-xl border border-line"
        />

        <div className="mt-5 rounded-xl border border-line bg-neutral-50 p-3">
          <p className="break-all text-xs text-ink-soft">{pix.qrCode}</p>
        </div>

        <Button type="button" className="mt-4 w-full" onClick={handleCopy}>
          {copied ? "Código copiado!" : "Copiar código Pix"}
        </Button>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-soft">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          Aguardando confirmação do pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Forma de pagamento</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Pix é aprovado na hora, direto aqui na loja. Cartão e boleto abrem o ambiente seguro do Mercado Pago.
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

      <div className="mt-5">
        <label htmlFor="cpf" className="text-sm font-medium text-ink">
          CPF do titular
        </label>
        <input
          id="cpf"
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Somente números"
          maxLength={14}
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-navy"
        />
        <p className="mt-1 text-xs text-ink-soft">Exigido pelo Mercado Pago para liberar o pagamento.</p>
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
