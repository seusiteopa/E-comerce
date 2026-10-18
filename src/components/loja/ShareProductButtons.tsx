"use client";

import { useState } from "react";
import { useStoreHref } from "@/components/store/StoreLink";

/** Compartilhar um produto: abre o link da loja atual no WhatsApp ou copia o endereço. */
export default function ShareProductButtons({ name, slug }: { name: string; slug: string }) {
  const path = useStoreHref(`/produtos/${slug}`);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${name}: ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
      >
        Compartilhar no WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
      >
        {copied ? "Link copiado" : "Copiar link"}
      </button>
    </div>
  );
}
