import { Package, ShoppingBag, Users } from "lucide-react";
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

  const [{ count: productCount }, { count: orderCount }, { data: buyerRows }, { data: paidOrders }] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("orders").select("profile_id").eq("store_id", storeId),
      supabase.from("orders").select("total").eq("store_id", storeId).eq("status", "pago"),
    ]);

  // Clientes da loja = pessoas que já fizeram pedido nela.
  const customerCount = new Set((buyerRows ?? []).map((o) => o.profile_id).filter(Boolean)).size;
  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <AdminHeader title="Dashboard" />
      <Container className="py-8">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Produtos cadastrados" value={String(productCount ?? 0)} icon={Package} />
          <StatCard label="Pedidos totais" value={String(orderCount ?? 0)} icon={ShoppingBag} />
          <StatCard label="Clientes" value={String(customerCount ?? 0)} icon={Users} />
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <p className="font-mono-label text-xs uppercase text-ink-soft">Receita confirmada (pedidos pagos)</p>
          <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(totalRevenue)}</p>
        </div>
      </Container>
    </>
  );
}
