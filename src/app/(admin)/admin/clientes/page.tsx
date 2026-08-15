import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ProfileRow } from "@/types/database";

export default async function AdminClientesPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("role", "cliente").order("created_at", { ascending: false });
  const rows = (data ?? []) as ProfileRow[];

  const columns: AdminColumn<ProfileRow>[] = [
    { header: "Nome", primary: true, cell: (r) => r.full_name || "—" },
    { header: "Telefone", primary: true, cell: (r) => r.phone ?? "—" },
    { header: "Cliente desde", cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <AdminHeader title="Clientes" />
      <Container className="py-8">
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum cliente cadastrado ainda." />
      </Container>
    </>
  );
}
