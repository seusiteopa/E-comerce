import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ProfileRow } from "@/types/database";

export default async function AdminClientesPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  // Clientes da loja = pessoas que já fizeram pedido nela. A regra do banco libera a leitura
  // desses perfis só para o dono/membro da loja (migração 020).
  const { data: buyers } = await supabase.from("orders").select("profile_id").eq("store_id", storeId);
  const ids = [...new Set((buyers ?? []).map((o) => o.profile_id).filter((v): v is string => Boolean(v)))];
  const { data } = ids.length
    ? await supabase.from("profiles").select("*").in("id", ids).order("created_at", { ascending: false })
    : { data: [] };
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
