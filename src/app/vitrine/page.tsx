import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import DeliveryNotice from "@/components/loja/DeliveryNotice";
import { getUnifiedProducts } from "@/lib/vitrine/unified";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vitrine — produtos de todas as lojas",
  description: "Encontre produtos de várias lojas em um só lugar.",
};

export default async function VitrineUnificadaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const products = await getUnifiedProducts(q);

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

        {products.length === 0 ? (
          <p className="mt-10 text-sm text-ink-soft">Nenhum produto encontrado.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const base = p.isPlatformOwned ? "" : `/lojas/${p.storeSlug}`;
              const onSale = p.promoPrice !== null && p.promoPrice < p.price;
              return (
                <a
                  key={p.id}
                  href={`${base}/produtos/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-paper">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : null}
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
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
