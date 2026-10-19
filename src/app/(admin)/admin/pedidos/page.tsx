import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PrintOrderButton from "@/components/admin/PrintOrderButton";
import NovoPedidoAlert from "@/components/admin/NovoPedidoAlert";
import { StatusPill } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";

interface OrderRowView {
  id: string;
  created_at: string;
  status: string;
  total: number;
  payer_email: string | null;
  channel: string;
  customer_name: string | null;
  payments: { status: string }[];
}

export default async function AdminPedidosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data } = await supabase
    .from("orders")
    .select("id, created_at, status, total, payer_email, channel, customer_name, payments(status)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as OrderRowView[];

  const columns: AdminColumn<OrderRowView>[] = [
    { header: "Pedido", primary: true, cell: (r) => `#${r.id.slice(0, 8)}` },
    { header: "Cliente", primary: true, cell: (r) => (r.channel === "balcao" ? `Balcão${r.customer_name ? ` · ${r.customer_name}` : ""}` : r.payer_email ?? "—") },
    { header: "Data", cell: (r) => formatDate(r.created_at) },
    { header: "Total", primary: true, cell: (r) => formatCurrency(Number(r.total)) },
    { header: "Pagamento", cell: (r) => <StatusPill status={(r.payments?.[0]?.status ?? "pendente") as never} kind="payment" /> },
    { header: "Status", primary: true, cell: (r) => <OrderStatusSelect orderId={r.id} currentStatus={r.status} /> },
    { header: "Cupom", cell: (r) => <PrintOrderButton orderId={r.id} compact /> },
  ];

  return (
    <>
      <AdminHeader title="Pedidos" />
      <Container className="py-8">
        <NovoPedidoAlert knownPaidIds={rows.filter((r) => r.status === "pago" && r.channel !== "balcao").map((r) => r.id)} />
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum pedido ainda." />
      </Container>
    </>
  );
}
