import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { requirePlatformPage } from "@/lib/platform";
import BriefingsList, { type BriefRow } from "@/components/plataforma/BriefingsList";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { BRIEF_LABEL, whatsappLink, type BriefKind, type BriefStatus } from "@/lib/briefing/schema";

export const metadata: Metadata = { title: "Pedidos de serviço", robots: { index: false, follow: false } };

export default async function PlataformaBriefingsPage() {
  await requirePlatformPage();
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("service_briefs")
    .select("id, kind, name, whatsapp, email, business, description, references_text, deadline, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const briefs: BriefRow[] = (data ?? []).map((b) => ({
    id: b.id,
    kindLabel: BRIEF_LABEL[b.kind as BriefKind] ?? b.kind,
    name: b.name,
    whatsapp: b.whatsapp,
    whatsappUrl: whatsappLink(b.whatsapp),
    email: b.email,
    business: b.business,
    description: b.description,
    references_text: b.references_text,
    deadline: b.deadline,
    status: b.status as BriefStatus,
    created_at: b.created_at,
  }));
  const novos = briefs.filter((b) => b.status === "novo").length;

  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Pedidos de serviço</h1>
        <p className="mt-2 text-sm text-ink-soft">Pedidos de site, imagens, banners e vídeos feitos na página inicial. {novos} novo(s).</p>
        <div className="mt-8">
          <BriefingsList briefs={briefs} />
        </div>
      </Container>
    </section>
  );
}
