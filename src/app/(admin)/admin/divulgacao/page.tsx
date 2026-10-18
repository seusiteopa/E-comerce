import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import DivulgacaoClient from "@/components/admin/DivulgacaoClient";
import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";

export default async function AdminDivulgacaoPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();

  const [{ data: products }, { data: briefs }, { data: campaigns }] = await Promise.all([
    supabase.from("products").select("id, name").eq("store_id", storeId).order("name"),
    supabase.from("marketing_briefs").select("id, title, format, audience, tone").eq("store_id", storeId).order("created_at", { ascending: false }),
    supabase.from("marketing_campaigns").select("id, content, kind, created_at").eq("store_id", storeId).order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <>
      <AdminHeader title="Central de divulgação" />
      <Container className="max-w-2xl py-8">
        <DivulgacaoClient products={products ?? []} briefs={briefs ?? []} />

        <section className="mt-10 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Campanhas geradas</h2>
          {(campaigns ?? []).length === 0 && <p className="text-sm text-ink-soft">Nenhuma campanha gerada ainda.</p>}
          {(campaigns ?? []).map((c) => (
            <div key={c.id} className="whitespace-pre-line rounded-xl border border-line bg-surface p-4 text-sm text-ink">
              {c.content}
            </div>
          ))}
        </section>
      </Container>
    </>
  );
}
