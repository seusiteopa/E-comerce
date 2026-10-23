import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { buildHistory, type Bucket } from "@/lib/history/buckets";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Histórico", robots: { index: false, follow: false } };

function Table({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Ainda não há vendas registradas.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Pedidos pagos</th>
                <th className="px-4 py-3">Total vendido</th>
                <th className="px-4 py-3">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.start + r.label} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{r.label}</td>
                  <td className="px-4 py-3">{r.ordersPaid}</td>
                  <td className="px-4 py-3">{formatCurrency(r.revenueCents / 100)}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatCurrency(r.averageTicketCents / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminHistoricoPage() {
  const { store } = await requireStoreAdmin();
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("store_daily_metrics")
    .select("day, orders_paid, revenue_cents")
    .eq("store_id", store.id)
    .order("day", { ascending: true });

  const metrics = (data ?? []).map((row) => ({
    day: row.day as string,
    ordersPaid: row.orders_paid as number,
    revenueCents: Number(row.revenue_cents),
  }));
  const history = buildHistory(metrics);

  return (
    <>
      <AdminHeader title="Histórico" />
      <Container className="py-8">
        <p className="text-sm text-ink-soft">
          Tudo o que a loja vendeu desde o início, por semana, mês e ano. Os períodos mais recentes aparecem primeiro.
        </p>
        <Table title="Por mês" rows={history.months} />
        <Table title="Por semana" rows={history.weeks} />
        <Table title="Por ano" rows={history.years} />
      </Container>
    </>
  );
}
