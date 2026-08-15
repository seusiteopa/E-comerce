import { notFound } from "next/navigation";
import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import ProductGrid from "@/components/loja/ProductGrid";
import { getCategoryBySlug, getProductsByCategory, mapToProduct } from "@/lib/data/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoria não encontrada" };
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const productRows = await getProductsByCategory(slug);
  const products = productRows.map(mapToProduct);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Categoria</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">{category.description}</p>
        )}

        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}
