import { Fragment } from "react";
import { getSiteSettings } from "@/lib/data/site-settings";
import { resolveHomeOrder, type HomeSection } from "@/lib/store/home-order";
import StoreLink from "@/components/store/StoreLink";
import Container from "@/components/ui/Container";
import ProductGrid from "@/components/loja/ProductGrid";
import HomeBanner from "@/components/loja/HomeBanner";
import HomeBannerCarousel from "@/components/loja/HomeBannerCarousel";
import { getFeaturedProducts, getActiveProducts, getActiveCategories, mapToProduct } from "@/lib/data/catalog";
import CategoryFilterableGrid from "@/components/loja/CategoryFilterableGrid";
import { getActiveBanners } from "@/lib/data/banners";

// Home enxuta: banner + vitrine, sem categorização explícita por tipo de
// produto e sem blocos de texto longos — pedido do dono da loja.

export default async function HomePage() {
  const [featuredRows, allRows, banners, secondaryBanners, categories] = await Promise.all([
    getFeaturedProducts(),
    getActiveProducts(),
    getActiveBanners("principal"),
    getActiveBanners("secundario"),
    getActiveCategories(),
  ]);
  const settings = await getSiteSettings();
  const featured = featuredRows.map(mapToProduct);
  const all = allRows.map(mapToProduct);

  const order = resolveHomeOrder(settings.home_order);
  const sections: Record<HomeSection, React.ReactNode> = {
    banner: <HomeBanner banners={banners} />,
    secundarios: secondaryBanners.length > 0 ? (
      <Container className="py-6">
        <HomeBannerCarousel banners={secondaryBanners} variant="secundario" />
      </Container>
    ) : null,
    destaques: featured.length > 0 ? (
      <section className="py-10 sm:py-14">
        <Container>
          <div className="flex items-end justify-between">
            <h1 className="text-xl font-semibold text-ink sm:text-2xl">Destaques</h1>
            <StoreLink href="/produtos" className="text-sm font-semibold text-navy hover:underline">
              Ver tudo →
            </StoreLink>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured} />
          </div>
        </Container>
      </section>
    ) : null,
    catalogo: (
      <section className="pb-14 pt-2 sm:pb-20">
        <Container>
          <CategoryFilterableGrid products={all} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        </Container>
      </section>
    ),
  };

  return (
    <>
      {order.map((key) => (
        <Fragment key={key}>{sections[key]}</Fragment>
      ))}
    </>
  );
}
