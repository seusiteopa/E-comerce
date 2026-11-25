import { Briefcase, FileText, Globe, ShoppingBag, Store, Users } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Números gerais da plataforma, para o dono ver de relance. */
export default async function ResumoPlataforma() {
  const service = createSupabaseServiceClient();
  const [cadastros, lojas, donos, compradores, briefsNovos, sites] = await Promise.all([
    service.from("profiles").select("id", { count: "exact", head: true }),
    service.from("stores").select("id", { count: "exact", head: true }).eq("is_platform_owned", false),
    service.from("store_members").select("user_id, stores!inner(is_platform_owned)").eq("role", "dono").eq("stores.is_platform_owned", false),
    service.from("orders").select("profile_id").eq("status", "pago").limit(10000),
    service.from("service_briefs").select("id", { count: "exact", head: true }).eq("status", "novo"),
    service.from("site_deliveries").select("id", { count: "exact", head: true }),
  ]);

  const lojistas = new Set((donos.data ?? []).map((m) => m.user_id)).size;
  const clientesCompradores = new Set((compradores.data ?? []).map((o) => o.profile_id).filter(Boolean)).size;

  return (
    <section aria-label="Resumo da plataforma" className="mb-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Contas cadastradas" value={String(cadastros.count ?? 0)} icon={Users} />
      <StatCard label="Clientes que já compraram" value={String(clientesCompradores)} icon={ShoppingBag} />
      <StatCard label="Lojistas" value={String(lojistas)} icon={Briefcase} />
      <StatCard label="Lojas de clientes" value={String(lojas.count ?? 0)} icon={Store} />
      <StatCard label="Pedidos de serviço novos" value={String(briefsNovos.count ?? 0)} icon={FileText} />
      <StatCard label="Sites publicados" value={String(sites.count ?? 0)} icon={Globe} />
    </section>
  );
}
