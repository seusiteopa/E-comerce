import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { ProductTypeBadge } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { CategoryRow } from "@/types/database";

interface CategoryRowWithId extends CategoryRow {
  id: string; // slug usado como chave para o AdminDataTable
}

export default async function AdminCategoriasPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("*").order("display_order");

  const rows = (data ?? []).map((c) => ({ ...c, id: c.slug })) as CategoryRowWithId[];

  const columns: AdminColumn<CategoryRowWithId>[] = [
    { header: "Nome", primary: true, cell: (r) => r.name },
    { header: "Tipo", primary: true, cell: (r) => <ProductTypeBadge type={r.product_type} /> },
    { header: "Categoria pai", cell: (r) => r.parent_slug ?? "—" },
    { header: "Ativa", primary: true, cell: (r) => (r.active ? "Sim" : "Não") },
  ];

  return (
    <>
      <AdminHeader title="Categorias" />
      <Container className="py-8">
        <p className="mb-5 text-sm text-ink-soft">
          Categorias iniciais vêm do seed do banco (supabase/seed.sql). Edição via painel fica para uma
          próxima iteração — hoje, alterações passam pelo SQL editor do Supabase.
        </p>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhuma categoria cadastrada." />
      </Container>
    </>
  );
}
