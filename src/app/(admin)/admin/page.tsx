import { CircleDollarSign, Clock, Package, Receipt, ShoppingBag, TrendingUp, Users } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import StatCard from "@/components/admin/StatCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();

  const [{ count: productCount }, { count: orderCount }, { data: buyerRows }, { data: paidOrders }, { count: pendingCount }] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("orders").select("profile_id").eq("store_id", storeId),
      supabase.from("orders").select("total, created_at").eq("store_id", storeId).eq("status", "pago"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "aguardando_pagamento"),
    ]);

  // Clientes da loja = pessoas que já fizeram pedido nela.
  const customerCount = new Set((buyerRows ?? []).map((o) => o.profile_id).filter(Boolean)).size;
  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const paidCount = paidOrders?.length ?? 0;
  const averageTicket = paidCount > 0 ? totalRevenue / paidCount : 0;
  // Página do servidor: o horário é calculado uma vez por carregamento (não é estado de tela).
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30Days = (paidOrders ?? [])
    .filter((o) => new Date(o.created_at).getTime() >= thirtyDaysAgo)
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <AdminHeader title="Dashboard" />
      <Container className="py-8">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Produtos cadastrados" value={String(productCount ?? 0)} icon={Package} />
          <StatCard label="Pedidos totais" value={String(orderCount ?? 0)} icon={ShoppingBag} />
          <StatCard label="Clientes" value={String(customerCount ?? 0)} icon={Users} />
          <StatCard label="Pedidos pagos" value={String(paidCount)} icon={Receipt} />
          <StatCard label="Aguardando pagamento" value={String(pendingCount ?? 0)} icon={Clock} />
          <StatCard label="Ticket médio" value={formatCurrency(averageTicket)} icon={CircleDollarSign} />
          <StatCard label="Vendas últimos 30 dias" value={formatCurrency(last30Days)} icon={TrendingUp} />
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <p className="font-mono-label text-xs uppercase text-ink-soft">Receita confirmada (pedidos pagos)</p>
          <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(totalRevenue)}</p>
        </div>
      </Container>
    </>
  );
}
