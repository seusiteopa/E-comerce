import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import HoursForm from "@/components/admin/HoursForm";
import Container from "@/components/ui/Container";
import { requireStoreAdmin } from "@/lib/auth";
import { getStoreHours } from "@/lib/store/hours-data";

export const metadata: Metadata = { title: "Horário", robots: { index: false, follow: false } };

export default async function AdminHorarioPage() {
  const { store } = await requireStoreAdmin();
  const saved = await getStoreHours(store.id);
  const initial = Array.from({ length: 7 }, (_, weekday) => {
    const row = saved.find((r) => r.weekday === weekday);
    return {
      weekday,
      closed: row ? row.closed : false,
      opens_at: row?.opens_at ? row.opens_at.slice(0, 5) : "18:00",
      closes_at: row?.closes_at ? row.closes_at.slice(0, 5) : "23:00",
    };
  });

  return (
    <>
      <AdminHeader title="Horário de funcionamento" />
      <Container className="py-8">
        <HoursForm initial={initial} />
      </Container>
    </>
  );
}
