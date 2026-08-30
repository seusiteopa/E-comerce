import { Package, ShoppingBag, Users } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import StatCard from "@/components/admin/StatCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();

  const [{ count: productCount }, { count: orderCount }, { count: customerCount }, { data: paidOrders }] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "cliente"),
      supabase.from("orders").select("total").eq("status", "pago"),
    ]);

  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <AdminHeader title="Dashboard" />
      <Container className="py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
