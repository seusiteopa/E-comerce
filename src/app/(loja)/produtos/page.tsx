import { Suspense } from "react";
import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import CatalogFilters from "@/components/loja/CatalogFilters";
import { getActiveProducts, mapToProduct } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Explore o catálogo completo da Vecorion: produtos físicos e digitais.",
};

// Catálogo muda com o cadastro do admin — revalida no máximo a cada 60s
// em vez de a cada requisição, equilibrando frescor de dado e carga no
// banco (Etapa 12, princípio de performance já aplicado na Home).
export const revalidate = 60;

export default async function ProdutosPage() {
  const productRows = await getActiveProducts();
  const products = productRows.map(mapToProduct);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Catálogo</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">Todos os produtos</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Produtos físicos e digitais — filtre por tipo ou ordene por preço.
        </p>

        <div className="mt-12">
          <Suspense fallback={<p className="text-sm text-ink-soft">Carregando produtos...</p>}>
            <CatalogFilters products={products} />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
