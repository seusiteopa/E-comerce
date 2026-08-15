import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import AdminDataTable, { AdminColumn } from "@/components/admin/AdminDataTable";
import ReleaseCourseButton from "@/components/admin/ReleaseCourseButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";

interface PendingCourseRow {
  id: string;
  product_name_snapshot: string;
  orders: { created_at: string; payer_email: string | null } | null;
}

export default async function AdminCursosPendentesPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("order_items")
    .select("id, product_name_snapshot, orders!inner(created_at, payer_email, status)")
    .eq("product_type_snapshot", "curso")
    .eq("course_access_released", false)
    .eq("orders.status", "pago");

  const rows = (data ?? []) as unknown as PendingCourseRow[];

  const columns: AdminColumn<PendingCourseRow>[] = [
    { header: "Curso", primary: true, cell: (r) => r.product_name_snapshot },
    { header: "Cliente", primary: true, cell: (r) => r.orders?.payer_email ?? "—" },
    { header: "Pago em", cell: (r) => (r.orders ? formatDate(r.orders.created_at) : "—") },
    { header: "Ação", primary: true, cell: (r) => <ReleaseCourseButton orderItemId={r.id} /> },
  ];

  return (
    <>
      <AdminHeader title="Cursos Pendentes de Liberação" />
      <Container className="py-8">
        <p className="mb-5 text-sm text-ink-soft">
          Cursos pagos aguardando liberação manual de acesso na Vecorion Cursos (integração automática ainda não existe — Etapa 1/4).
        </p>
        <AdminDataTable columns={columns} rows={rows} emptyLabel="Nenhum curso pendente de liberação." />
      </Container>
    </>
  );
}
