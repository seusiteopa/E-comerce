import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

interface BannerRow {
  id: string;
  title: string | null;
  position: string;
  active: boolean;
}

export default async function AdminBannersPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("banners").select("id, title, position, active").order("display_order");
  const rows = (data ?? []) as BannerRow[];

  const columns: AdminColumn<BannerRow>[] = [
    { header: "Título", primary: true, cell: (r) => r.title ?? "—" },
    { header: "Posição", primary: true, cell: (r) => r.position },
    { header: "Ativo", primary: true, cell: (r) => (r.active ? "Sim" : "Não") },
  ];

  return (
    <>
      <AdminHeader title="Banners" />
      <Container className="py-8">
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum banner cadastrado ainda." />
      </Container>
    </>
  );
}
