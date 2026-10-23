import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatCurrency } from "@/lib/format";
import { isBlockedByOverdue } from "@/lib/billing/invoices";
import OpenSetupForm from "@/components/plataforma/OpenSetupForm";

export const metadata: Metadata = { title: "Cobranças — Painel da plataforma", robots: { index: false, follow: false } };

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  paga: "Paga",
  cancelada: "Cancelada",
};

function brDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function PlataformaCobrancasPage() {
  await requirePlatformAdmin();
  const service = createSupabaseServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: invoices }, { data: stores }] = await Promise.all([
    service
      .from("billing_invoices")
      .select("id, store_id, due_date, period_start, amount_cents, status, paid_at")
      .order("due_date", { ascending: false })
      .limit(300),
    service.from("stores").select("id, name, slug").eq("is_platform_owned", false),
  ]);

  const storeById = new Map((stores ?? []).map((s) => [s.id, s]));
  const rows = invoices ?? [];

  const openTotal = rows.filter((i) => i.status === "aberta").reduce((sum, i) => sum + i.amount_cents, 0);
  const paidTotal = rows.filter((i) => i.status === "paga").reduce((sum, i) => sum + i.amount_cents, 0);

  // Lojas bloqueadas hoje: cobrança aberta com mais de 3 dias de atraso.
  const blockedStores = (stores ?? []).filter((s) =>
    isBlockedByOverdue(rows.filter((i) => i.store_id === s.id).map((i) => ({ status: i.status, due_date: i.due_date })), today)
  );

  return (
    <Container className="py-8">
      <h1 className="text-xl font-semibold text-ink">Cobranças das lojas</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-soft">A receber (abertas)</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(openTotal / 100)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-soft">Recebido (pagas)</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(paidTotal / 100)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-soft">Lojas bloqueadas por atraso</p>
          <p className="mt-1 text-lg font-semibold text-ink">{blockedStores.length}</p>
        </div>
      </div>

      <div className="mt-8">
        <OpenSetupForm stores={(stores ?? []).map((st) => ({ id: st.id, name: st.name }))} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-soft">Nenhuma cobrança criada ainda.</td></tr>
            )}
            {rows.map((i) => {
              const store = storeById.get(i.store_id);
              const late = i.status === "aberta" && i.due_date < today;
              return (
                <tr key={i.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{store?.name ?? "Loja removida"}</td>
                  <td className="px-4 py-3 text-ink-soft">{brDate(i.period_start)}</td>
                  <td className="px-4 py-3 text-ink-soft">{brDate(i.due_date)}</td>
                  <td className="px-4 py-3">{formatCurrency(i.amount_cents / 100)}</td>
                  <td className={`px-4 py-3 ${late ? "font-semibold text-status-danger" : "text-ink"}`}>
                    {late ? "Vencida" : statusLabel[i.status] ?? i.status}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{i.paid_at ? brDate(i.paid_at.slice(0, 10)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
