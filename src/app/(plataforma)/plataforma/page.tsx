import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import PlatformStoreActions from "@/components/admin/PlatformStoreActions";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeOrigin } from "@/lib/store/urls";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Painel da plataforma — Vecorion", robots: { index: false, follow: false } };

const subscriptionLabel: Record<string, string> = {
  sem_assinatura: "—",
  pendente: "Aguardando autorização",
  em_teste: "Mês grátis",
  ativa: "Ativa",
  pausada: "Pausada (MP)",
  cancelada: "Cancelada",
};

export default async function PlataformaPage() {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    // Sinal interno do Next (renderização dinâmica) não é recusa de acesso: repassa.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: unknown }).digest).includes("DYNAMIC")) throw err;
    console.error("[plataforma] acesso negado:", err instanceof Error ? err.message : err);
    redirect("/");
  }

  const service = createSupabaseServiceClient();
  const [{ data: stores }, { data: billings }, { data: connections }, { data: orders }] = await Promise.all([
    service.from("stores").select("id, slug, name, status, custom_domain, is_platform_owned, created_at").order("created_at", { ascending: true }),
    service.from("store_billing").select("*"),
    service.from("store_payment_connections").select("store_id, status"),
    service.from("orders").select("store_id").eq("status", "pago"),
  ]);

  const billingByStore = new Map((billings ?? []).map((b) => [b.store_id, b]));
  const connectionByStore = new Map((connections ?? []).map((c) => [c.store_id, c.status]));
  const paidOrders = new Map<string, number>();
  (orders ?? []).forEach((o) => paidOrders.set(o.store_id, (paidOrders.get(o.store_id) ?? 0) + 1));

  const rows = await Promise.all(
    (stores ?? []).map(async (s) => ({ ...s, url: await storeOrigin(s), billing: billingByStore.get(s.id) }))
  );

  const late = rows.filter((r) => r.billing?.billing_status === "atrasada").length;
  const paused = rows.filter((r) => r.status === "pausada").length;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold text-ink">Painel da plataforma</h1>
      <a href="/plataforma/cobrancas" className="mt-2 inline-block text-sm font-semibold text-navy hover:underline">Cobranças das lojas →</a>
      <p className="mt-1 text-sm text-ink-soft">
        {rows.length} loja(s) · {late} com mensalidade atrasada · {paused} pausada(s). Atraso não pausa a loja sozinho: você decide aqui.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="p-4">Loja</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Mensalidade</th>
              <th className="p-4">Situação</th>
              <th className="p-4">Próxima cobrança</th>
              <th className="p-4">Mercado Pago</th>
              <th className="p-4">Vendas pagas</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const b = r.billing;
              return (
                <tr key={r.id} className="border-b border-line last:border-0 align-top">
                  <td className="p-4">
                    <Link href={`/plataforma/lojas/${r.slug}`} className="font-semibold text-navy hover:underline">{r.name}</Link>
                    <p className="text-xs text-ink-soft">{r.slug}{r.is_platform_owned ? " · plataforma" : ""}</p>
                    <p className="text-xs text-ink-soft">{r.status === "pausada" ? "PAUSADA" : "Ativa"} · criada em {formatDate(r.created_at)}</p>
                  </td>
                  <td className="p-4">
                    {b?.plan === "mensalidade"
                      ? `Mensalidade R$ ${((b.monthly_fee_cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : `Comissão ${((b?.commission_bps ?? 0) / 100).toLocaleString("pt-BR")}%`}
                  </td>
                  <td className="p-4">{b?.plan === "mensalidade" ? subscriptionLabel[b.subscription_status] ?? b.subscription_status : "—"}</td>
                  <td className={`p-4 font-medium ${b?.billing_status === "atrasada" ? "text-status-danger" : "text-ink"}`}>
                    {b?.billing_status === "atrasada" ? "Atrasada" : "Em dia"}
                  </td>
                  <td className="p-4">{b?.plan === "mensalidade" && b.next_due_at ? formatDate(b.next_due_at) : "—"}</td>
                  <td className="p-4">{r.is_platform_owned ? "Conta principal" : connectionByStore.get(r.id) === "conectado" ? "Conectado" : "Não conectado"}</td>
                  <td className="p-4">{paidOrders.get(r.id) ?? 0}</td>
                  <td className="p-4">
                    <PlatformStoreActions
                      storeId={r.id}
                      status={r.status as "ativa" | "pausada"}
                      billingStatus={(b?.billing_status ?? "em_dia") as "em_dia" | "atrasada"}
                      isPlatformOwned={r.is_platform_owned}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
