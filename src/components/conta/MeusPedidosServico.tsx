import Link from "next/link";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { BRIEF_STATUS_LABEL, type BriefKind, type BriefStatus } from "@/lib/briefing/schema";
import ShareLinkButtons from "@/components/conta/ShareLinkButtons";
import ReferenceUploader from "@/components/conta/ReferenceUploader";

type FileRow = { id: string; brief_id: string; kind: string; url: string; media_type: string; name: string | null };

const TITLE: Record<BriefKind, { plural: string; novo: string; vazio: string }> = {
  site: { plural: "Meus sites", novo: "Pedir um site", vazio: "Você ainda não pediu nenhum site." },
  imagens: { plural: "Minhas imagens", novo: "Pedir imagens ou banners", vazio: "Você ainda não pediu imagens." },
  videos: { plural: "Meus vídeos", novo: "Pedir um vídeo", vazio: "Você ainda não pediu nenhum vídeo." },
};

function FileThumb({ f }: { f: FileRow }) {
  if (f.media_type === "imagem") {
    // eslint-disable-next-line @next/next/no-img-element
    return <a href={f.url} target="_blank" rel="noopener noreferrer"><img src={f.url} alt={f.name ?? "Imagem"} className="h-28 w-28 rounded-xl border border-line object-cover" /></a>;
  }
  if (f.media_type === "video") {
    return <video src={f.url} controls preload="metadata" className="h-28 w-44 rounded-xl border border-line bg-black object-cover" />;
  }
  return <a href={f.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-navy underline">{f.name ?? "Abrir arquivo"}</a>;
}

/** Lista os pedidos de serviço do cliente (site, imagens ou vídeos), com a entrega quando liberada. */
export default async function MeusPedidosServico({ kind }: { kind: BriefKind }) {
  const profile = await requireAuthenticatedProfile();
  const service = createSupabaseServiceClient();
  const { data: briefs } = await service
    .from("service_briefs")
    .select("id, description, business, status, references_text, deadline, site_slug, released_at, created_at")
    .eq("user_id", profile.id)
    .eq("kind", kind)
    .order("created_at", { ascending: false });
  const ids = (briefs ?? []).map((b) => b.id);
  const { data: files } = ids.length
    ? await service.from("brief_files").select("id, brief_id, kind, url, media_type, name").in("brief_id", ids).order("created_at")
    : { data: [] as FileRow[] };
  const byBrief = (id: string, k: string) => ((files ?? []) as FileRow[]).filter((f) => f.brief_id === id && f.kind === k);
  const t = TITLE[kind];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{t.plural}</h2>
        <Link href={`/pedido?tipo=${kind}`} className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">{t.novo}</Link>
      </div>

      {(briefs ?? []).length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink-soft">{t.vazio}</p>
        </div>
      )}

      {(briefs ?? []).map((b) => {
        const entregas = byBrief(b.id, "entrega");
        const refs = byBrief(b.id, "referencia");
        const released = Boolean(b.released_at);
        return (
          <article key={b.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{b.business || t.plural} <span className="font-normal text-ink-soft">· pedido de {new Date(b.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span></p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${released ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning"}`}>
                {released ? "Entregue" : BRIEF_STATUS_LABEL[b.status as BriefStatus]}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm text-ink">{b.description}</p>

            {released ? (
              <div className="flex flex-col gap-3 rounded-xl bg-status-success-bg/60 p-4">
                <p className="text-sm font-semibold text-ink">Sua entrega está pronta</p>
                {kind === "site" && b.site_slug && <ShareLinkButtons path={`/sites/${b.site_slug}`} />}
                {entregas.length > 0 && <div className="flex flex-wrap gap-3">{entregas.map((f) => <FileThumb key={f.id} f={f} />)}</div>}
              </div>
            ) : (
              <p className="rounded-xl bg-paper p-4 text-sm text-ink-soft">Estamos trabalhando no seu pedido. Quando ficar pronto, a entrega aparece aqui.</p>
            )}

            {(refs.length > 0 || b.references_text) && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Suas referências</p>
                {b.references_text && <p className="whitespace-pre-line text-sm text-ink">{b.references_text}</p>}
                {refs.length > 0 && <div className="flex flex-wrap gap-3">{refs.map((f) => <FileThumb key={f.id} f={f} />)}</div>}
              </div>
            )}
            {!released && <ReferenceUploader briefId={b.id} />}
          </article>
        );
      })}
    </div>
  );
}
