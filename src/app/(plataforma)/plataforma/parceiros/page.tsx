import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import PartnersAdmin from "@/components/plataforma/PartnersAdmin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Agências", robots: { index: false, follow: false } };

export default async function PlataformaParceirosPage() {
  const service = createSupabaseServiceClient();
  const [{ data: partners }, { data: stores }] = await Promise.all([
    service.from("partners").select("id, name, status").order("name"),
    service.from("stores").select("id, name, partner_id").eq("is_platform_owned", false).order("name"),
  ]);
  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Agências</h1>
        <div className="mt-8">
          <PartnersAdmin partners={partners ?? []} stores={(stores ?? []).map((s) => ({ id: s.id, name: s.name, partner_id: s.partner_id }))} />
        </div>
      </Container>
    </section>
  );
}
