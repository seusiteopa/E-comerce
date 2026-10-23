import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import DeliveryNotice from "@/components/loja/DeliveryNotice";
import { getUnifiedProducts, type UnifiedProduct } from "@/lib/vitrine/unified";
import { getEligibleSponsoredStoreIds } from "@/lib/sponsorship/service";
import { interleaveSponsored, pickTopSponsored, visitRotation } from "@/lib/vitrine/sponsored";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vitrine — produtos de todas as lojas",
  description: "Encontre produtos de várias lojas em um só lugar.",
};

export default async function VitrineUnificadaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [products, eligibleStores] = await Promise.all([getUnifiedProducts(q), getEligibleSponsoredStoreIds()]);
  // Um card patrocinado por loja: o produto mais recente dela.
  const sponsoredCards: UnifiedProduct[] = eligibleStores
    .map((id) => products.find((p) => p.storeId === id))
    .filter((p): p is UnifiedProduct => Boolean(p));
  const rotation = visitRotation();
  const top = pickTopSponsored(sponsoredCards.map((c) => ({ ...c, storeId: c.storeId })), rotation);
  const mixed = interleaveSponsored(products, sponsoredCards, rotation);

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Vitrine</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Produtos de todas as lojas</h1>

        <form method="GET" action="/vitrine" className="mt-6 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar produto"
            className="w-full max-w-md rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
          <button type="submit" className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Buscar</button>
        </form>

        {top.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Patrocinado</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {top.map((p) => (
                <ProductTile key={`top-${p.id}`} p={p} sponsored />
              ))}
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <p className="mt-10 text-sm text-ink-soft">Nenhum produto encontrado.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {mixed.map((entry, index) => (
              <ProductTile key={`${entry.kind}-${index}`} p={entry.item as UnifiedProduct} sponsored={entry.kind === "sponsored"} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function ProductTile({ p, sponsored = false }: { p: UnifiedProduct; sponsored?: boolean }) {
  const base = p.isPlatformOwned ? "" : `/lojas/${p.storeSlug}`;
  const onSale = p.promoPrice !== null && p.promoPrice < p.price;
  return (
    <a
      href={`${base}/produtos/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : null}
        {sponsored && <span className="absolute left-2 top-2 rounded-full bg-farol px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-deep">Patrocinado</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-ink-soft">{p.storeName}</p>
        <h2 className="line-clamp-2 text-sm font-semibold text-ink">{p.name}</h2>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink">{formatCurrency(onSale ? p.promoPrice! : p.price)}</span>
          {onSale && <span className="text-xs text-ink-soft line-through">{formatCurrency(p.price)}</span>}
        </div>
        <DeliveryNotice scope={p.deliveryScope} baseCity={p.deliveryBaseCity} cities={p.deliveryCities} />
      </div>
    </a>
  );
}
