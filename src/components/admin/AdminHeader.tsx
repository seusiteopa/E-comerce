import { getCurrentStore } from "@/lib/store/current";
import StoreLink from "@/components/store/StoreLink";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Lojas que a pessoa logada administra, para trocar de loja sem voltar à lista. */
async function getMyStores(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("store_members")
    .select("stores(slug, name)")
    .eq("user_id", user.id);
  return (data ?? [])
    .map((row) => row.stores as unknown as { slug: string; name: string } | null)
    .filter((s): s is { slug: string; name: string } => Boolean(s));
}

export default async function AdminHeader({ title }: { title: string }) {
  const [store, myStores] = await Promise.all([getCurrentStore(), getMyStores()]);
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-8">
      <div className="min-w-0">
        {myStores.length > 1 ? (
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 truncate text-xs text-ink-soft hover:underline">
              Painel de {store.name}
              <span aria-hidden="true" className="text-[10px]">▾</span>
            </summary>
            <div className="absolute left-0 z-30 mt-2 flex min-w-[14rem] flex-col rounded-xl border border-line bg-surface p-2 shadow-lg">
              {myStores.map((s) => (
                <a
                  key={s.slug}
                  href={`/lojas/${s.slug}/admin`}
                  className={`rounded-lg px-3 py-2 text-sm hover:bg-paper ${s.slug === store.slug ? "font-semibold text-navy" : "text-ink"}`}
                >
                  {s.name}
                </a>
              ))}
              <a href="/conta/lojas" className="mt-1 rounded-lg px-3 py-2 text-xs text-ink-soft hover:bg-paper">
                Ver todas as lojas
              </a>
            </div>
          </details>
        ) : (
          <StoreLink href="/admin" className="truncate text-xs text-ink-soft hover:underline">Painel de {store.name}</StoreLink>
        )}
        <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
      </div>
      <a href={`/lojas/${store.slug}`} className="shrink-0 text-xs font-medium text-navy hover:underline">
        Ver loja
      </a>
    </header>
  );
}
