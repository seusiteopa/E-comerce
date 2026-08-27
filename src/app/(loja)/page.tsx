import Link from "next/link";
import Container from "@/components/ui/Container";
import ProductGrid from "@/components/loja/ProductGrid";
import HomeBanner from "@/components/loja/HomeBanner";
import HomeBannerCarousel from "@/components/loja/HomeBannerCarousel";
import { getFeaturedProducts, getActiveProducts, mapToProduct } from "@/lib/data/catalog";
import { getActiveBanners } from "@/lib/data/banners";

// Home enxuta: banner + vitrine, sem categorização explícita por tipo de
// produto e sem blocos de texto longos — pedido do dono da loja.
export const revalidate = 60;

export default async function HomePage() {
  const [featuredRows, allRows, banners, secondaryBanners] = await Promise.all([
    getFeaturedProducts(),
    getActiveProducts(),
    getActiveBanners("principal"),
    getActiveBanners("secundario"),
  ]);
  const featured = featuredRows.map(mapToProduct);
  const all = allRows.map(mapToProduct);

  return (
    <>
      <HomeBanner banners={banners} />

      {secondaryBanners.length > 0 && (
        <Container className="py-6">
          <HomeBannerCarousel banners={secondaryBanners} variant="secundario" />
        </Container>
      )}

      {featured.length > 0 && (
        <section className="py-10 sm:py-14">
          <Container>
            <div className="flex items-end justify-between">
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">Destaques</h1>
              <Link href="/produtos" className="text-sm font-semibold text-navy hover:underline">
                Ver tudo →
              </Link>
            </div>
            <div className="mt-6">
              <ProductGrid products={featured} />
            </div>
          </Container>
        </section>
      )}

      <section className="pb-14 pt-2 sm:pb-20">
        <Container>
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">Todos os produtos</h2>
          </div>
          <div className="mt-6">
            <ProductGrid products={all} />
          </div>
        </Container>
      </section>
    </>
  );
}
