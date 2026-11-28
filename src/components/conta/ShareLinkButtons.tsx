"use client";

import { useState } from "react";

/** Copiar e compartilhar o link do site entregue. */
export default function ShareLinkButtons({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url());
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meu site", url: url() });
      } catch {
        // pessoa cancelou
      }
    } else {
      await copy();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={path} target="_blank" rel="noopener noreferrer" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Abrir meu site</a>
      <button type="button" onClick={copy} className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper">{copied ? "Link copiado!" : "Copiar link"}</button>
      <button type="button" onClick={share} className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper">Compartilhar</button>
    </div>
  );
}
