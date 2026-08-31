"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "vecorion_welcome_popup_seen";

export default function WelcomeCouponPopup({
  couponCode,
  message,
}: {
  couponCode?: string;
  message?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!couponCode) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [couponCode]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sem localStorage disponível — só fecha, sem persistir.
    }
  }

  async function handleCopy() {
    if (!couponCode) return;
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!visible || !couponCode) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={dismiss}>
      <div
        role="dialog"
        aria-labelledby="welcome-popup-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Oferta de boas-vindas</p>
        <h2 id="welcome-popup-title" className="mt-2 text-xl font-bold text-ink">
          {message?.trim() || "Ganhe um desconto na sua primeira compra"}
        </h2>

        <div className="mt-5 flex items-center gap-2 rounded-xl border-2 border-dashed border-navy/40 bg-navy/5 px-4 py-3">
          <span className="flex-1 text-center text-lg font-bold tracking-wider text-navy">{couponCode}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Use esse código no carrinho na hora de finalizar a compra.
        </p>
      </div>
    </div>
  );
}
