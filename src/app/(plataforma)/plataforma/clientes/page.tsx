import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { requirePlatformPage } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Clientes e lojas", robots: { index: false, follow: false } };

export default async function PlataformaClientesPage() {
  await requirePlatformPage();
  const service = createSupabaseServiceClient();
  const { data: members } = await service
    .from("store_members")
    .select("user_id, store_id, role, stores(name, slug, status)")
    .eq("role", "dono");
  const { data: conns } = await service.from("store_payment_connections").select("store_id, status");
  const connByStore = new Map((conns ?? []).map((c) => [c.store_id, c.status]));

  const ownerIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles } = ownerIds.length
    ? await service.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Cliente sem nome"]));

  type StoreLine = { name: string; slug: string; status: string; mp: string };
  const byOwner = new Map<string, { name: string; stores: StoreLine[] }>();
  for (const m of members ?? []) {
    const st = m.stores as unknown as { name: string; slug: string; status: string } | null;
    if (!st) continue;
    const entry: { name: string; stores: StoreLine[] } = byOwner.get(m.user_id) ?? { name: nameOf.get(m.user_id) ?? "Cliente", stores: [] };
    entry.stores.push({ name: st.name, slug: st.slug, status: st.status, mp: connByStore.get(m.store_id) === "conectado" ? "Mercado Pago conectado" : "Mercado Pago desconectado" });
    byOwner.set(m.user_id, entry);
  }
  const owners = [...byOwner.values()].sort((a, b) => a.name.localeCompare(b.name));
  const totalLojas = owners.reduce((sum, o) => sum + o.stores.length, 0);

  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Clientes e lojas</h1>
        <p className="mt-2 text-sm text-ink-soft">{owners.length} lojista(s) · {totalLojas} loja(s) no total.</p>
        <div className="mt-8 flex flex-col gap-4">
          {owners.length === 0 && <p className="text-sm text-ink-soft">Nenhum cliente com loja ainda.</p>}
          {owners.map((o) => (
            <div key={o.name + o.stores[0]?.slug} className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-semibold text-ink">{o.name} <span className="text-sm font-normal text-ink-soft">· {o.stores.length} {o.stores.length === 1 ? "loja" : "lojas"}</span></p>
              <ul className="mt-3 flex flex-col gap-2">
                {o.stores.map((s) => (
                  <li key={s.slug} className="text-sm text-ink">
                    {s.name} <span className="text-ink-soft">· /lojas/{s.slug} · {s.status === "encerrada" ? "encerrada" : "ativa"} · {s.mp}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
