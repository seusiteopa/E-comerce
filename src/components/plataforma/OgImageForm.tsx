"use client";

import { useState, useTransition } from "react";
import { saveOgImageAction } from "@/actions/plataforma/og";
import Button from "@/components/ui/Button";

export default function OgImageForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    if (!file) {
      setMessage("Escolha uma imagem.");
      return;
    }
    startTransition(async () => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
        reader.readAsDataURL(file);
      });
      const r = await saveOgImageAction(dataUrl);
      setMessage(r.success ? "Imagem salva. Ela aparece quando alguém compartilha o link da página inicial da Vecorion." : r.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-soft">
        Esta imagem é só da <strong>página inicial da Vecorion</strong>. A imagem de cada loja continua separada. Use PNG, JPG ou WEBP, de até 800 KB, de preferência 1200 × 630 pixels.
      </p>
      <input type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar imagem"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
