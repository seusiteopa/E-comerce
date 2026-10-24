import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import PartnerSetupForm from "@/components/parceiro/PartnerSetupForm";
import NewClientStoreForm from "@/components/parceiro/NewClientStoreForm";
import { getActivePartner } from "@/lib/partners/access";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Área da agência", robots: { index: false, follow: false } };

export default async function ParceiroPage() {
  const partner = await getActivePartner();
  if (!partner) {
    return (
      <section className="py-16">
        <Container>
          <p className="text-sm text-ink-soft">Esta área é só para agências cadastradas e ativas. Fale com a Vecorion.</p>
        </Container>
      </section>
    );
  }
  const service = createSupabaseServiceClient();
  const { data: stores } = await service.from("stores").select("id, name, slug, status").eq("partner_id", partner.id).order("name");

  return (
    <section className="py-12">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Agência</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{partner.name}</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-soft">
          Aqui você vê só as lojas vinculadas à sua agência. Pode abrir a criação assistida de cada uma. O pagamento é feito pela loja, por Pix, e o acerto com a sua agência fica por fora do sistema.
        </p>
        <div className="mt-8">
          <NewClientStoreForm />
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {(stores ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma loja vinculada ainda.</p>
          ) : (
            (stores ?? []).map((s) => (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-semibold text-ink">{s.name}</p>
                <p className="text-xs text-ink-soft">Situação: {s.status}</p>
                <a href={`/lojas/${s.slug}/admin`} className="mt-2 inline-block text-sm font-semibold text-navy underline">Abrir painel da loja</a>
                <div className="mt-3">
                  <PartnerSetupForm storeId={s.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </Container>
    </section>
  );
}
