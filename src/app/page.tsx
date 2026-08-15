import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import ProductGrid from "@/components/loja/ProductGrid";
import { searchProducts, mapToProduct } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Busca" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const productRows = query ? await searchProducts(query) : [];
  const products = productRows.map(mapToProduct);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Busca</SectionEyebrow>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
          {query ? `Resultados para "${query}"` : "Digite algo para buscar"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {query && `${products.length} ${products.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}
        </p>

        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}
