import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import ProductGrid from "@/components/loja/ProductGrid";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getProductsByCategory, mapToProduct } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Serviços",
  description: "Criação de sites, landing pages, sistemas e soluções com inteligência artificial da Vecorion.",
};

export const revalidate = 60;

export default async function ServicosPage() {
  const productRows = await getProductsByCategory("servicos");
  const products = productRows.map(mapToProduct);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Serviços</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">
          Soluções sob medida para o seu negócio
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Sites, sistemas e soluções com inteligência artificial, pensados para o seu contexto.
        </p>

        <div className="mt-8">
          <WhatsAppButton message="Olá! Tenho interesse em conhecer os serviços da Vecorion." />
        </div>

        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}
