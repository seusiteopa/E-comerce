"use client";

import { useState } from "react";

/** Copia o endereço público da loja para a área de transferência. */
export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
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
  );
}
