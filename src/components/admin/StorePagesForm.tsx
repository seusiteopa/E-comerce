"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { updateStorePagesAction } from "@/actions/admin/loja";

const FIELDS = [
  { key: "page_sobre", label: "Sobre a loja" },
  { key: "page_faq", label: "Perguntas frequentes (FAQ)" },
  { key: "page_contato", label: "Contato" },
  { key: "page_politica_privacidade", label: "Política de Privacidade" },
  { key: "page_politica_termos", label: "Termos de Uso" },
  { key: "page_politica_trocas", label: "Trocas e Devolução" },
] as const;

export default function StorePagesForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateStorePagesAction(values);
      setMessage(result.success ? "Páginas salvas." : result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">Páginas da loja</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Escreva o texto de cada página. Use uma linha em branco para separar parágrafos. Página sem texto não aparece no site.
        </p>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="text-sm font-medium text-ink">{f.label}</label>
          <textarea
            id={f.key}
            rows={4}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
      ))}
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar páginas"}</Button>
    </form>
  );
}
