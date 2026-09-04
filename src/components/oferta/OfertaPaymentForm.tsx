"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buyExclusiveProductAction } from "@/actions/oferta";

interface OfertaPaymentFormProps {
  slug: string;
  name: string;
  price: number;
}

interface PixState {
  qrCodeBase64: string;
  qrCode: string;
}

const priceFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Etapa 2 da oferta exclusiva: só o pagamento, em página própria (não
 * mais na mesma tela do produto). Chegou aqui a partir do botão
 * "Comprar agora" em OfertaShowcase.
 */
export default function OfertaPaymentForm({ slug, name, price }: OfertaPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleSubmit() {
    setError(null);

    const digitsOnly = cpf.replace(/\D/g, "");
    if (payerName.trim().length < 2) return setError("Informe seu nome completo.");
    if (!payerEmail.includes("@")) return setError("Informe um e-mail válido.");
    if (digitsOnly.length !== 11) return setError("Informe um CPF válido (11 números).");

    setSubmitting(true);
    const result = await buyExclusiveProductAction({
      productSlug: slug,
      payerName,
      payerEmail,
      payerDocument: digitsOnly,
      paymentMethod,
    });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result.data.paymentMethod === "redirect") {
      window.location.href = result.data.checkoutUrl;
      return;
    }

    setPix({ qrCodeBase64: result.data.qrCodeBase64, qrCode: result.data.qrCode });
    setSubmitting(false);

    const paymentId = result.data.paymentId;
    pollRef.current = setInterval(async () => {
      const { getPixPaymentStatusAction } = await import("@/actions/checkout");
      const status = await getPixPaymentStatusAction(paymentId);
      if (status.success && status.data.status === "approved") {
        if (pollRef.current) clearInterval(pollRef.current);
        setPaid(true);
      }
    }, 5000);
  }

  async function handleCopy() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (paid) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink">Pagamento confirmado!</h1>
        <p className="mt-2 text-sm text-ink-soft">Obrigado, {payerName.split(" ")[0]}. Você receberá mais detalhes em breve por e-mail.</p>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="text-lg font-semibold text-ink">Pague com Pix</h1>
        <p className="mt-1 text-sm text-ink-soft">Escaneie o QR Code ou copie o código abaixo.</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code Pix"
          className="mt-6 h-60 w-60 rounded-xl border border-line"
        />

        <div className="mt-5 w-full rounded-xl border border-line bg-neutral-50 p-3">
          <p className="break-all text-xs text-ink-soft">{pix.qrCode}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 w-full rounded-xl bg-[#173F82] px-4 py-3 text-sm font-semibold text-white"
        >
          {copied ? "Código copiado!" : "Copiar código Pix"}
        </button>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-soft">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          Aguardando confirmação do pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-10">
      <Link href={`/oferta/${slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </Link>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
        <span className="truncate text-sm font-medium text-ink">{name}</span>
        <span className="shrink-0 text-sm font-bold text-navy">{priceFormatter.format(price)}</span>
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Finalizar compra</h2>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("pix")}
          className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            paymentMethod === "pix" ? "border-navy bg-navy/5 text-navy" : "border-line text-ink-soft"
          }`}
        >
          Pix
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("cartao")}
          className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            paymentMethod === "cartao" ? "border-navy bg-navy/5 text-navy" : "border-line text-ink-soft"
          }`}
        >
          Cartão
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div>
          <label htmlFor="payerName" className="text-sm font-medium text-ink">
            Nome completo
          </label>
          <input
            id="payerName"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label htmlFor="payerEmail" className="text-sm font-medium text-ink">
            E-mail
          </label>
          <input
            id="payerEmail"
            type="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label htmlFor="cpf" className="text-sm font-medium text-ink">
            CPF
          </label>
          <input
            id="cpf"
            inputMode="numeric"
            placeholder="Somente números"
            maxLength={14}
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-status-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-[#173F82] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting
          ? "Processando..."
          : paymentMethod === "pix"
            ? `Pagar ${priceFormatter.format(price)} com Pix`
            : `Pagar ${priceFormatter.format(price)} com cartão`}
      </button>
    </div>
  );
}
