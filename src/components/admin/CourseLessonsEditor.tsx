"use client";

import { useState, useTransition } from "react";
import { saveCourseLessonsAction } from "@/actions/admin/aulas";
import Button from "@/components/ui/Button";

type Row = { title: string; videoUrl: string };
const field = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";

export default function CourseLessonsEditor({ productId, initial }: { productId: string; initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function move(i: number, delta: number) {
    setRows((prev) => {
      const next = [...prev];
      const j = i + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const r = await saveCourseLessonsAction({ productId, lessons: rows });
      setMessage(r.success ? "Aulas salvas." : r.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Use vídeos <strong>não listados</strong> no YouTube, para que só quem tem o link consiga assistir. Não divulgue o endereço dos vídeos fora do curso. Vídeos <strong>privados</strong> não aparecem para o cliente. Também aceitamos links do Vimeo.
      </p>
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">Aula {i + 1}</span>
            <input className={`${field} flex-1`} placeholder="Título da aula" value={r.title} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <button type="button" className="text-xs text-ink-soft underline" onClick={() => move(i, -1)}>subir</button>
            <button type="button" className="text-xs text-ink-soft underline" onClick={() => move(i, 1)}>descer</button>
            <button type="button" className="text-xs text-status-danger underline" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>remover</button>
          </div>
          <input className={field} placeholder="Link do vídeo (YouTube não listado ou Vimeo)" value={r.videoUrl} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, videoUrl: e.target.value } : x)))} />
        </div>
      ))}
      <button type="button" className="self-start text-sm font-semibold text-navy underline" onClick={() => setRows((p) => [...p, { title: "", videoUrl: "" }])}>+ Adicionar aula</button>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar aulas"}</Button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
