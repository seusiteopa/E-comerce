"use client";

import { useState, useTransition } from "react";
import { saveSiteDeliveryAction } from "@/actions/plataforma/sites";
import Button from "@/components/ui/Button";

export default function SiteDeliveryForm({ orderId, initialSlug }: { orderId: string; initialSlug: string }) {
  const [slug, setSlug] = useState(initialSlug);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const field = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";

  function publish() {
    setMessage(null);
    if (!file) {
      setMessage("Escolha o arquivo HTML do site.");
      return;
    }
    startTransition(async () => {
      const html = await file.text();
      const r = await saveSiteDeliveryAction({ orderId, slug, html });
      setMessage(r.success ? `Publicado em ${r.data.url}` : r.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">/sites/</span>
        <input className={`${field} flex-1`} placeholder="nome-do-cliente" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
      </div>
      <input type="file" accept=".html,text/html" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={publish} disabled={pending}>{pending ? "Publicando..." : "Publicar site"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
