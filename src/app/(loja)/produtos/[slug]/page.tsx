import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import Container from "@/components/ui/Container";
import { CategoryBadge } from "@/components/ui/Badge";
import PriceTag from "@/components/ui/PriceTag";
import ProductActions from "@/components/loja/ProductActions";
import ProductGallery from "@/components/loja/ProductGallery";
import ProductCard from "@/components/loja/ProductCard";
import {
  getProductBySlug,
  getCategoryBySlug,
  getRelatedProducts,
  mapToProduct,
} from "@/lib/data/catalog";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const productRow = await getProductBySlug(slug);
  if (!productRow) return { title: "Produto não encontrado" };

  return {
    title: productRow.name,
    description: productRow.short_description ?? undefined,
    openGraph: {
      title: productRow.name,
      description: productRow.short_description ?? undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productRow = await getProductBySlug(slug);
  if (!productRow || productRow.hidden) notFound();

  const product = mapToProduct(productRow);
  const category = await getCategoryBySlug(product.categorySlug);
  const relatedRows = await getRelatedProducts(productRow);
  const relatedProducts = relatedRows.map(mapToProduct);

  return (
    <>
      <section className="bg-paper py-16 sm:py-20">
        <Container className="max-w-5xl">
          <nav aria-label="Trilha de navegação" className="text-xs text-ink-soft">
            <Link href="/produtos" className="hover:text-navy">Produtos</Link>
            <span className="mx-2">/</span>
            <span>{category?.name}</span>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
            <ProductGallery media={product.images} productName={product.name} />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CategoryBadge label={category?.name ?? ""} />
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{product.name}</h1>
              <div className="mt-3">
                <PriceTag price={product.price} promoPrice={product.promoPrice} size="lg" />
              </div>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">{product.description}</p>

              <div className="mt-8">
                <ProductActions product={product} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {product.serviceIncludes && product.serviceIncludes.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container className="max-w-3xl">
            <h2 className="text-xl font-semibold text-ink">O que está incluso</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {product.serviceIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="bg-surface py-16 sm:py-20">
          <Container>
            <h2 className="text-2xl font-semibold text-ink">Produtos relacionados</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related) => (
                <ProductCard key={related.slug} product={related} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
