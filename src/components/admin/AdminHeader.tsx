import StoreLink from "@/components/store/StoreLink";
import { getCurrentStore } from "@/lib/store/current";

export default async function AdminHeader({ title }: { title: string }) {
  const store = await getCurrentStore();
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-8">
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-soft">Painel de {store.name}</p>
        <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
      </div>
      <StoreLink href="/" className="shrink-0 text-xs font-medium text-navy hover:underline">
        Ver loja
      </StoreLink>
    </header>
  );
}
