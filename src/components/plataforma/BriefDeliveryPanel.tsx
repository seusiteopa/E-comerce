"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDeliveryMediaAction, removeBriefFileAction, saveBriefSiteAction, setBriefReleasedAction } from "@/actions/plataforma/entrega";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { MAX_ENTREGA_MIDIAS, mediaTypeOf } from "@/lib/briefing/arquivos";

export type DeliveryFile = { id: string; url: string; media_type: string; name: string | null };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-navy";

export default function BriefDeliveryPanel({
  briefId, kind, siteSlug, hasSiteFile, released, entregas,
}: {
  briefId: string; kind: string; siteSlug: string | null; hasSiteFile: boolean; released: boolean; entregas: DeliveryFile[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(siteSlug ?? "");
  const [html, setHtml] = useState<{ name: string; text: string } | null>(null);
  const [media, setMedia] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const left = MAX_ENTREGA_MIDIAS - entregas.length;

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        const r = await task();
        if (r.success) {
          setMessage(ok);
          router.refresh();
        } else {
          setMessage(r.error ?? "Não foi possível concluir.");
        }
      } catch (err) {
        setMessage((err as Error).message || "Não foi possível concluir.");
      }
    });
  }

  async function pickHtml(file: File | undefined) {
    if (!file) return setHtml(null);
    setHtml({ name: file.name, text: await file.text() });
  }

  function uploadMedia() {
    run(async () => {
      const uploaded: { url: string; mediaType: "imagem" | "video"; name: string }[] = [];
      for (const file of media.slice(0, Math.max(left, 0))) {
        const type = mediaTypeOf(file.type);
        if (type === "arquivo") throw new Error("Use só imagens ou vídeos.");
        const url = await uploadFileToCloudinary(file, type === "imagem" ? "image" : "video", `vecorion/entregas/${briefId}`);
        uploaded.push({ url, mediaType: type, name: file.name });
      }
      const r = await addDeliveryMediaAction(briefId, uploaded);
      if (r.success) setMedia([]);
      return r;
    }, "Mídias enviadas.");
  }

  return (
    <div className="flex flex-col gap-6">
      {kind === "site" && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">1. Arquivo do site</h2>
          <p className="mt-1 text-sm text-ink-soft">{hasSiteFile ? "Já há um arquivo salvo. Enviar outro substitui o atual." : "Envie o arquivo HTML do site e escolha o endereço."}</p>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center gap-2"><span className="text-sm text-ink-soft">/sites/</span><input className={input} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="nome-do-cliente" /></div>
            <input type="file" accept=".html,text/html" className="text-sm" onChange={(e) => pickHtml(e.target.files?.[0])} />
            <button type="button" disabled={isPending || !html || !slug} onClick={() => run(() => saveBriefSiteAction(briefId, slug, html!.text), "Site salvo.")} className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">Salvar site</button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">{kind === "site" ? "2." : "1."} Mídias da entrega ({entregas.length}/{MAX_ENTREGA_MIDIAS})</h2>
        {entregas.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {entregas.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate text-navy underline">{f.name ?? f.url}</a>
                <button type="button" disabled={isPending} onClick={() => run(() => removeBriefFileAction(briefId, f.id), "Mídia removida.")} className="text-xs font-semibold text-status-danger hover:underline">Remover</button>
              </li>
            ))}
          </ul>
        )}
        {left > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            <input type="file" multiple accept="image/*,video/*" className="text-sm" onChange={(e) => setMedia(Array.from(e.target.files ?? []).slice(0, left))} />
            <button type="button" disabled={isPending || media.length === 0} onClick={uploadMedia} className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{isPending ? "Enviando..." : "Enviar mídias"}</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Limite de {MAX_ENTREGA_MIDIAS} mídias atingido. Remova uma para enviar outra.</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">{kind === "site" ? "3." : "2."} Liberar para o cliente</h2>
        <p className="mt-1 text-sm text-ink-soft">{released ? "Entrega liberada: o cliente já vê e pode compartilhar." : "Enquanto não liberar, o cliente não vê a entrega nem o link do site."}</p>
        <button type="button" disabled={isPending} onClick={() => run(() => setBriefReleasedAction(briefId, !released), released ? "Entrega recolhida." : "Entrega liberada.")} className={`mt-3 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 ${released ? "bg-status-danger" : "bg-status-success"}`}>
          {released ? "Recolher entrega" : "Liberar entrega"}
        </button>
      </section>
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
    </div>
  );
}
