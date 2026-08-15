import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import QuoteStatusSelect from "@/components/admin/QuoteStatusSelect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";

interface QuoteRow {
  id: string;
  contact_name: string;
  contact_email: string;
  message: string;
  status: string;
  created_at: string;
  products: { name: string } | null;
}

export default async function AdminOrcamentosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("quote_requests")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as QuoteRow[];

  const columns: AdminColumn<QuoteRow>[] = [
    { header: "Cliente", primary: true, cell: (r) => `${r.contact_name} — ${r.contact_email}` },
    { header: "Serviço", primary: true, cell: (r) => r.products?.name ?? "—" },
    { header: "Data", cell: (r) => formatDate(r.created_at) },
    { header: "Status", primary: true, cell: (r) => <QuoteStatusSelect quoteRequestId={r.id} currentStatus={r.status} /> },
  ];

  return (
    <>
      <AdminHeader title="Solicitações de Orçamento" />
      <Container className="py-8">
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhuma solicitação de orçamento ainda." />
      </Container>
    </>
  );
}
