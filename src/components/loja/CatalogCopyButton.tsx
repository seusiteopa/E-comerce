"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

/** Copia o texto do catálogo para colar no WhatsApp ou no Instagram. */
export default function CatalogCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button type="button" onClick={copy}>
      {copied ? "Texto copiado!" : "Copiar texto para WhatsApp e Instagram"}
    </Button>
  );
}
