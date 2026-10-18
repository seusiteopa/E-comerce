import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import { requireAdminProfile } from "@/lib/auth";
import { getCurrentStore } from "@/lib/store/current";
import { ensureReferralCode } from "@/lib/store/referral";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminIndicacoesPage() {
  await requireAdminProfile();
  const store = await getCurrentStore();
  const code = await ensureReferralCode(store.id);
  const supabase = await createSupabaseServerClient();
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, discount_pct, created_at, applied_at, stores!referrals_referred_store_id_fkey(name)")
    .eq("referrer_store_id", store.id)
    .order("created_at", { ascending: false });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const link = `${origin}/criar-loja?ref=${code}`;
  const statusLabel: Record<string, string> = { pendente: "Aguardando autorização da loja indicada", aplicada: "Aplicada", cancelada: "Cancelada" };

  return (
    <>
      <AdminHeader title="Indicações" />
      <Container className="max-w-2xl py-8">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Seu link de indicação</h2>
          <p className="mt-2 break-all text-sm text-ink-soft">{link}</p>
          <p className="mt-3 text-sm text-ink">
            Quem criar uma loja por esse link ganha o cadastro, e você ganha <strong>20% de desconto na próxima mensalidade</strong> depois que a loja indicada autorizar a assinatura.
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Suas indicações</h2>
          {(referrals ?? []).length === 0 && <p className="text-sm text-ink-soft">Nenhuma indicação ainda.</p>}
          {(referrals ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
              <p className="font-semibold text-ink">{(r.stores as { name?: string } | null)?.name ?? "Loja indicada"}</p>
              <p className="text-ink-soft">{statusLabel[r.status] ?? r.status} · {r.discount_pct}% de desconto</p>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
}
