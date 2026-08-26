import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import CouponForm from "@/components/admin/CouponForm";
import DeleteCouponButton from "@/components/admin/DeleteCouponButton";
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
    { header: "Ações", primary: true, cell: (r) => <DeleteCouponButton code={r.code} /> },
  ];

  return (
    <>
      <AdminHeader title="Cupons" />
      <Container className="py-8">
        <div className="mb-8 max-w-lg">
          <CouponForm />
        </div>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum cupom cadastrado ainda." />
      </Container>
    </>
  );
}
