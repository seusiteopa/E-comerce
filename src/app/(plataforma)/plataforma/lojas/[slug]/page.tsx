import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import PlatformStoreActions from "@/components/admin/PlatformStoreActions";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Loja — Painel da plataforma", robots: { index: false, follow: false } };

const subscriptionLabel: Record<string, string> = {
  sem_assinatura: "—",
  pendente: "Aguardando autorização",
  em_teste: "Mês grátis",
  ativa: "Ativa",
  pausada: "Pausada (MP)",
  cancelada: "Cancelada",
};

export default async function PlataformaLojaPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: unknown }).digest).includes("DYNAMIC")) throw err;
    console.error("[plataforma/loja] acesso negado:", err instanceof Error ? err.message : err);
    redirect("/");
  }

  const { slug } = await params;
  const service = createSupabaseServiceClient();
  const { data: store } = await service
    .from("stores")
    .select("id, slug, name, status, is_platform_owned, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!store) notFound();

  const [{ data: billing }, { data: connection }, { count: paidCount }] = await Promise.all([
    service.from("store_billing").select("*").eq("store_id", store.id).maybeSingle(),
    service.from("store_payment_connections").select("status").eq("store_id", store.id).maybeSingle(),
    service.from("orders").select("id", { count: "exact", head: true }).eq("store_id", store.id).eq("status", "pago"),
  ]);

  const mensalidade = billing?.plan === "mensalidade"
    ? `R$ ${((billing.monthly_fee_cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "Sem mensalidade";

  return (
    <Container className="py-10">
      <Link href="/plataforma" className="text-sm font-semibold text-navy hover:underline">← Voltar ao painel</Link>

      <h1 className="mt-4 text-2xl font-semibold text-ink">{store.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {store.slug}{store.is_platform_owned ? " · conta principal" : ""} · criada em {formatDate(store.created_at)}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/lojas/${store.slug}`} className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
          Abrir a loja
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-base font-semibold text-ink">Configurações da plataforma</h2>
        <p className="mt-1 text-sm text-ink-soft">Somente o dono da plataforma altera estas opções.</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-soft">Plano</dt><dd className="font-medium text-ink">{mensalidade}</dd></div>
          <div><dt className="text-ink-soft">Assinatura</dt><dd className="font-medium text-ink">{subscriptionLabel[billing?.subscription_status ?? "sem_assinatura"] ?? billing?.subscription_status}</dd></div>
          <div><dt className="text-ink-soft">Mensalidade</dt><dd className="font-medium text-ink">{billing?.billing_status === "atrasada" ? "Atrasada" : "Em dia"}</dd></div>
          <div><dt className="text-ink-soft">Mercado Pago</dt><dd className="font-medium text-ink">{store.is_platform_owned ? "Conta principal" : connection?.status === "conectado" ? "Conectado" : "Não conectado"}</dd></div>
          <div><dt className="text-ink-soft">Vendas pagas</dt><dd className="font-medium text-ink">{paidCount ?? 0}</dd></div>
        </dl>
        <div className="mt-6">
          <PlatformStoreActions
            storeId={store.id}
            status={store.status as "ativa" | "pausada"}
            billingStatus={(billing?.billing_status ?? "em_dia") as "em_dia" | "atrasada"}
            isPlatformOwned={store.is_platform_owned}
          />
        </div>
      </section>
    </Container>
  );
}
