import { getCurrentStore } from "@/lib/store/current";
import StoreLink from "@/components/store/StoreLink";

export default async function AdminHeader({ title }: { title: string }) {
  const store = await getCurrentStore();
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-8">
      <div className="min-w-0">
        <StoreLink href="/admin" className="truncate text-xs text-ink-soft hover:underline">Painel de {store.name}</StoreLink>
        <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
      </div>
      <a href={`/lojas/${store.slug}`} className="shrink-0 text-xs font-medium text-navy hover:underline">
        Ver loja
      </a>
    </header>
  );
}
