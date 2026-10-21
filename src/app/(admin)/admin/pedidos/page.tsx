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
import { formatCurrency } from "@/lib/format";

interface OrderRowView {
  id: string;
  created_at: string;
  status: string;
  total: number;
  payer_email: string | null;
  channel: string;
  customer_name: string | null;
  payments: { status: string; method: string | null }[];
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: { product_name_snapshot: string; quantity: number; unit_price_snapshot: number; products: { short_description: string | null } | null }[];
}

function paymentMethodLabel(method: string | null | undefined): string {
  const labels: Record<string, string> = { pix: "Pix", cartao: "Cartão de crédito", credito: "Cartão de crédito", debito: "Cartão de débito", boleto: "Boleto", dinheiro: "Dinheiro" };
  return method ? labels[method] ?? method : "Pix ou cartão";
}

export default async function AdminPedidosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data } = await supabase
    .from("orders")
    .select("id, created_at, status, total, payer_email, channel, customer_name, payments(status, method), profiles(full_name, phone), order_items(product_name_snapshot, quantity, unit_price_snapshot, products(short_description))")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as OrderRowView[];

  const columns: AdminColumn<OrderRowView>[] = [
    { header: "Pedido", primary: true, cell: (r) => `#${r.id.slice(0, 8)}` },
    { header: "Cliente", primary: true, cell: (r) => (r.channel === "balcao" ? `Balcão${r.customer_name ? ` · ${r.customer_name}` : ""}` : r.profiles?.full_name || r.customer_name || "—") },
    { header: "Telefone", primary: true, cell: (r) => r.profiles?.phone || "—" },
    { header: "E-mail", primary: true, cell: (r) => r.payer_email ?? "—" },
    { header: "Data e hora", primary: true, cell: (r) => new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) },
    { header: "Produtos", primary: true, cell: (r) => (
      <div className="flex flex-col gap-2">
        {(r.order_items ?? []).map((it, idx) => (
          <div key={idx}>
            <p className="font-medium">{it.quantity}× {it.product_name_snapshot} · {formatCurrency(Number(it.unit_price_snapshot) * it.quantity)}</p>
            {it.products?.short_description && <p className="text-xs text-ink-soft">{it.products.short_description}</p>}
          </div>
        ))}
        {(r.order_items ?? []).length === 0 && <span>—</span>}
      </div>
    ) },
    { header: "Total", primary: true, cell: (r) => formatCurrency(Number(r.total)) },
    { header: "Forma de pagamento", primary: true, cell: (r) => `${paymentMethodLabel(r.payments?.[0]?.method)} · ${r.payments?.[0]?.status ?? "pendente"}` },
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
