import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { CouponRow } from "@/types/database";

interface CouponRowWithId extends CouponRow {
  id: string;
}

export default async function AdminCuponsPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("coupons").select("*").order("code");
  const rows = (data ?? []).map((c) => ({ ...c, id: c.code })) as CouponRowWithId[];

  const columns: AdminColumn<CouponRowWithId>[] = [
    { header: "Código", primary: true, cell: (r) => r.code },
    { header: "Desconto", primary: true, cell: (r) => (r.discount_type === "percentual" ? `${r.discount_value}%` : `R$ ${r.discount_value}`) },
    { header: "Ativo", primary: true, cell: (r) => (r.active ? "Sim" : "Não") },
  ];

  return (
    <>
      <AdminHeader title="Cupons" />
      <Container className="py-8">
        <p className="mb-5 text-sm text-ink-soft">
          Criação de cupom via painel fica para uma próxima iteração — hoje, cadastro pelo SQL editor do Supabase.
        </p>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum cupom cadastrado ainda." />
      </Container>
    </>
  );
}
