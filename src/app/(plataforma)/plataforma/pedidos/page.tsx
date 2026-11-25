import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { requirePlatformPage } from "@/lib/platform";
import StoreRequestsList from "@/components/plataforma/StoreRequestsList";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Pedidos das lojas", robots: { index: false, follow: false } };

export default async function PlataformaPedidosPage() {
  await requirePlatformPage();
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("store_requests")
    .select("id, store_id, kind, status, note, created_at, stores(name), requested_by")
    .eq("status", "pendente")
    .order("created_at", { ascending: false });

  const ownerIds = [...new Set((data ?? []).map((r) => r.requested_by).filter(Boolean))] as string[];
  const { data: profiles } = ownerIds.length
    ? await service.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Cliente"]));

  const requests = (data ?? []).map((r) => ({
    id: r.id,
    store_id: r.store_id,
    store_name: (r.stores as unknown as { name: string } | null)?.name ?? "Loja",
    kind: r.kind,
    status: r.status,
    note: r.note,
    created_at: r.created_at,
    owner: names.get(r.requested_by ?? "") ?? "Cliente",
  }));

  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Pedidos das lojas</h1>
        <p className="mt-2 text-sm text-ink-soft">Pedidos de exclusão aguardam a sua decisão. Encerramentos feitos pelo dono aparecem como avisos.</p>
        <div className="mt-8">
          <StoreRequestsList requests={requests} />
        </div>
      </Container>
    </section>
  );
}
