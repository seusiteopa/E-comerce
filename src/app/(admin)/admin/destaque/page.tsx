import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import DestaqueToggle from "@/components/admin/DestaqueToggle";
import Container from "@/components/ui/Container";
import { requireStoreFinanceAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Destaque", robots: { index: false, follow: false } };

export default async function AdminDestaquePage() {
  const { store } = await requireStoreFinanceAdmin();
  const service = createSupabaseServiceClient();
  const { data: sponsor } = await service.from("sponsorships").select("status, monthly_fee_cents").eq("store_id", store.id).maybeSingle();
  const active = sponsor?.status === "ativo";
  const fee = (sponsor?.monthly_fee_cents ?? 10000) / 100;

  return (
    <>
      <AdminHeader title="Destaque" />
      <Container className="py-8">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Destaque na vitrine da plataforma</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Sua loja aparece na vitrine geral, com a marcação <strong>Patrocinado</strong>. São {formatCurrency(fee)} por mês, cobrados por Pix na tela de Pagamentos.
          </p>
          <p className="mt-2 text-sm text-ink-soft">Só aparece quem está com a mensalidade em dia.</p>
          <div className="mt-4">
            <DestaqueToggle active={active} />
          </div>
        </div>
      </Container>
    </>
  );
}
