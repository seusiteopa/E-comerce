"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReferenceFilesAction, addReferenceTextAction, getReferenceUploadSignatureAction } from "@/actions/conta/briefing-arquivos";
import { mediaTypeOf } from "@/lib/briefing/arquivos";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-navy";

/** O cliente acrescenta referências (links, observações, imagens, vídeos, PDF) ao pedido dele. */
export default function ReferenceUploader({ briefId }: { briefId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    setMessage(null);
    startTransition(async () => {
      try {
        if (text.trim()) {
          const r = await addReferenceTextAction(briefId, text);
          if (!r.success) return setMessage(r.error);
        }
        if (files.length > 0) {
          const uploaded: { url: string; mediaType: "imagem" | "video" | "arquivo"; name: string }[] = [];
          for (const file of files) {
            const sig = await getReferenceUploadSignatureAction();
            const form = new FormData();
            form.append("file", file);
            form.append("api_key", sig.apiKey);
            form.append("timestamp", String(sig.timestamp));
            form.append("signature", sig.signature);
            form.append("folder", sig.folder);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body: form });
            if (!res.ok) throw new Error("Falha no envio de um arquivo.");
            const data = (await res.json()) as { secure_url: string };
            uploaded.push({ url: data.secure_url, mediaType: mediaTypeOf(file.type), name: file.name });
          }
          const r = await addReferenceFilesAction(briefId, uploaded);
          if (!r.success) return setMessage(r.error);
        }
        setText("");
        setFiles([]);
        setMessage("Referências enviadas.");
        router.refresh();
      } catch (err) {
        setMessage((err as Error).message || "Não foi possível enviar agora.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-line bg-paper p-4">
      <p className="text-sm font-medium text-ink">Enviar referências</p>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} className={input} placeholder="Links de exemplos, observações ou o que você quer mudar" />
      <input type="file" multiple accept="image/*,video/*,.pdf" className="text-sm" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={send} disabled={isPending || (!text.trim() && files.length === 0)} className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {isPending ? "Enviando..." : "Enviar"}
        </button>
        {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
