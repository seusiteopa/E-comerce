import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import CopyLinkButton from "@/components/conta/CopyLinkButton";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Minhas lojas — Vecorion", robots: { index: false, follow: false } };

export default async function MinhasLojasPage() {
  const profile = await requireAuthenticatedProfile();
  const service = createSupabaseServiceClient();

  const { data: memberships } = await service
    .from("store_members")
    .select("role, stores(id, slug, name, status, logo_url)")
    .eq("user_id", profile.id);

  const stores = (memberships ?? [])
    .map((m) => ({ role: m.role, store: Array.isArray(m.stores) ? m.stores[0] : m.stores }))
    .filter((m): m is { role: string; store: { id: string; slug: string; name: string; status: string; logo_url: string | null } } => Boolean(m.store));

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Minhas lojas</h1>
        <Link href="/criar-loja" className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
          Criar nova loja
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
          Você ainda não administra nenhuma loja.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {stores.map(({ role, store }) => {
            const publicPath = `/lojas/${store.slug}`;
            const publicUrl = `${origin}${publicPath}`;
            return (
              <li key={store.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center gap-4">
                  {store.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-sm font-semibold text-ink-soft">
                      {store.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-ink">{store.name}</p>
                    <p className="text-xs text-ink-soft">
                      {store.status === "pausada" ? "Pausada" : "Ativa"} · {role === "dono" ? "Dono" : "Membro"}
                    </p>
                  </div>
                </div>
                <p className="break-all text-xs text-ink-soft">{publicUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/lojas/${store.slug}/admin`} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Painel
                  </Link>
                  <Link href={publicPath} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
                    Ver vitrine
                  </Link>
                  <CopyLinkButton url={publicUrl} />
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Conheça a loja ${store.name}: ${publicUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
                  >
                    Compartilhar no WhatsApp
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
