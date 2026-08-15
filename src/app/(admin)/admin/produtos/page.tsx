import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { LinkButton } from "@/components/ui/Button";
import { ProductTypeBadge } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { ProductRow } from "@/types/database";

export default async function AdminProdutosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as ProductRow[];

  const columns: AdminColumn<ProductRow>[] = [
    { header: "Nome", primary: true, cell: (r) => <Link href={`/produtos/${r.slug}`} className="hover:underline">{r.name}</Link> },
    { header: "Tipo", primary: true, cell: (r) => <ProductTypeBadge type={r.type} /> },
    { header: "Preço", cell: (r) => formatCurrency(Number(r.price)) },
    { header: "Status", primary: true, cell: (r) => r.status },
  ];

  return (
    <>
      <AdminHeader title="Produtos" />
      <Container className="py-8">
        <div className="mb-5 flex justify-end">
          <LinkButton href="/admin/produtos/novo">Novo produto</LinkButton>
        </div>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum produto cadastrado ainda." />
      </Container>
    </>
  );
}
