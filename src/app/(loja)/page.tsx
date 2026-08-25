import Link from "next/link";
import Container from "@/components/ui/Container";
import ProductGrid from "@/components/loja/ProductGrid";
import HomeBanner from "@/components/loja/HomeBanner";
import { getFeaturedProducts, mapToProduct } from "@/lib/data/catalog";
import { getActiveBanners } from "@/lib/data/banners";

// Home enxuta: banner + vitrine, sem categorização explícita por tipo de
// produto e sem blocos de texto longos — pedido do dono da loja.
export const revalidate = 60;

export default async function HomePage() {
  const [featuredRows, banners] = await Promise.all([getFeaturedProducts(), getActiveBanners("principal")]);
  const featured = featuredRows.map(mapToProduct);

  return (
    <>
      <HomeBanner banners={banners} />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="flex items-end justify-between">
            <h1 className="text-xl font-semibold text-ink sm:text-2xl">Vitrine</h1>
            <Link href="/produtos" className="text-sm font-semibold text-navy hover:underline">
              Ver tudo →
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured} />
          </div>
        </Container>
      </section>
    </>
  );
}
