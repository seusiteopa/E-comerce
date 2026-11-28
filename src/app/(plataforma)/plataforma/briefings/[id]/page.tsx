import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import { requirePlatformPage } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import BriefDeliveryPanel, { type DeliveryFile } from "@/components/plataforma/BriefDeliveryPanel";
import { BRIEF_LABEL, whatsappLink, type BriefKind } from "@/lib/briefing/schema";

export const metadata: Metadata = { title: "Entrega do pedido", robots: { index: false, follow: false } };

export default async function PlataformaBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const service = createSupabaseServiceClient();
  const { data: brief } = await service
    .from("service_briefs")
    .select("id, kind, name, whatsapp, email, business, description, references_text, deadline, status, site_slug, delivery_html, released_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!brief) notFound();
  const { data: files } = await service.from("brief_files").select("id, kind, url, media_type, name").eq("brief_id", id).order("created_at");
  const entregas = (files ?? []).filter((f) => f.kind === "entrega") as DeliveryFile[];
  const refs = (files ?? []).filter((f) => f.kind === "referencia") as DeliveryFile[];

  return (
    <section className="py-10">
      <Container className="max-w-3xl">
        <Link href="/plataforma/briefings" className="text-sm font-semibold text-navy hover:underline">← Pedidos de serviço</Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{BRIEF_LABEL[brief.kind as BriefKind] ?? brief.kind} · {brief.name}{brief.business ? ` (${brief.business})` : ""}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pedido de {new Date(brief.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}{brief.deadline ? ` · prazo: ${brief.deadline}` : ""} ·{" "}
          <a href={whatsappLink(brief.whatsapp)} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline">Chamar no WhatsApp</a>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">O que o cliente pediu</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink">{brief.description}</p>
          {brief.references_text && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">Referências: {brief.references_text}</p>}
          {refs.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {refs.map((f) => (
                <li key={f.id}><a href={f.url} target="_blank" rel="noopener noreferrer" className="text-navy underline">{f.name ?? f.url}</a></li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <BriefDeliveryPanel
            briefId={brief.id}
            kind={brief.kind}
            siteSlug={brief.site_slug}
            hasSiteFile={Boolean(brief.delivery_html)}
            released={Boolean(brief.released_at)}
            entregas={entregas}
          />
        </div>
        {brief.site_slug && (
          <p className="mt-6 text-sm text-ink-soft">
            Endereço do site: <a href={`/sites/${brief.site_slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline">/sites/{brief.site_slug}</a>
            {brief.released_at ? "" : " (só abre para o público depois de liberar)"}
          </p>
        )}
      </Container>
    </section>
  );
}
