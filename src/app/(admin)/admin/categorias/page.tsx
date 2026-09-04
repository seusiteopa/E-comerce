import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import CategoryForm from "@/components/admin/CategoryForm";
import CategoryRowActions from "@/components/admin/CategoryRowActions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  product_type: string;
  active: boolean;
}

export default async function AdminCategoriasPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id, slug, name, product_type, active").order("name");
  const rows = (data ?? []) as CategoryRow[];

  const columns: AdminColumn<CategoryRow>[] = [
    { header: "Nome", primary: true, cell: (r) => r.name },
    { header: "Tipo", primary: true, cell: (r) => (r.product_type === "fisico" ? "Físico" : "Digital") },
    { header: "Ativa", primary: true, cell: (r) => (r.active ? "Sim" : "Não") },
    { header: "Ações", primary: true, cell: (r) => <CategoryRowActions slug={r.slug} name={r.name} active={r.active} /> },
  ];

  return (
    <>
      <AdminHeader title="Categorias" />
      <Container className="py-8">
        <div className="mb-8 max-w-lg">
          <CategoryForm />
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Não é possível excluir uma categoria enquanto algum produto estiver usando ela — edite o produto e troque a categoria dele primeiro.
        </p>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhuma categoria cadastrada ainda." />
      </Container>
    </>
  );
}
