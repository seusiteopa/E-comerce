import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { StatusPill } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";

interface OrderRowView {
  id: string;
  created_at: string;
  status: string;
  total: number;
  payer_email: string | null;
  payments: { status: string }[];
}

export default async function AdminPedidosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, created_at, status, total, payer_email, payments(status)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as OrderRowView[];

  const columns: AdminColumn<OrderRowView>[] = [
    { header: "Pedido", primary: true, cell: (r) => `#${r.id.slice(0, 8)}` },
    { header: "Cliente", primary: true, cell: (r) => r.payer_email ?? "—" },
    { header: "Data", cell: (r) => formatDate(r.created_at) },
    { header: "Total", primary: true, cell: (r) => formatCurrency(Number(r.total)) },
    { header: "Pagamento", cell: (r) => <StatusPill status={(r.payments?.[0]?.status ?? "pendente") as never} kind="payment" /> },
    { header: "Status", primary: true, cell: (r) => <OrderStatusSelect orderId={r.id} currentStatus={r.status} /> },
  ];

  return (
    <>
      <AdminHeader title="Pedidos" />
      <Container className="py-8">
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum pedido ainda." />
      </Container>
    </>
  );
}
