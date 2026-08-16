import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import ProductGrid from "@/components/loja/ProductGrid";
import Accordion from "@/components/ui/Accordion";
import { getFeaturedProducts, getTopLevelCategories, mapToProduct } from "@/lib/data/catalog";
import { faqItems } from "@/data/faq";

// Etapa 13: substitui os arrays mock (@/data/products, @/data/categories)
// por consulta real ao Supabase — achado da auditoria técnica corrigido.
export const revalidate = 60;

const typeCards = [
  { type: "fisico", label: "Produtos Físicos", href: "/categorias/produtos-fisicos", description: "Vestuário e acessórios Vecorion" },
  { type: "digital", label: "Produtos Digitais", href: "/categorias/produtos-digitais", description: "E-books, templates e kits" },
  { type: "curso", label: "Cursos", href: "/categorias/cursos", description: "Formações e treinamentos" },
  { type: "servico", label: "Serviços", href: "/servicos", description: "Sites, sistemas e soluções com IA" },
] as const;

export default async function HomePage() {
  const featuredRows = await getFeaturedProducts();
  const featured = featuredRows.map(mapToProduct);
  const categories = await getTopLevelCategories();

  return (
    <>
      <section className="bg-paper py-14 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="font-mono-label text-xs uppercase text-navy">Loja Vecorion</span>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              Tecnologia, produtos e soluções em um só lugar.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              Produtos físicos, produtos digitais, cursos e serviços da Vecorion — um ecossistema pensado para crescer com você.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LinkButton href="/produtos" variant="primary">Explorar produtos</LinkButton>
              <LinkButton href="/servicos" variant="ghost">Ver serviços</LinkButton>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <Image src="/brand/vecorion-icone-navy-transparente.png" alt="" fill className="object-contain" priority aria-hidden="true" />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {typeCards.map((card) => (
              <Link
                key={card.type}
                href={card.href}
                className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-navy/40"
              >
                <h2 className="text-base font-semibold text-ink">{card.label}</h2>
                <p className="mt-2 text-xs text-ink-soft">{card.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-navy transition-transform group-hover:translate-x-1">
                  Ver mais →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface py-14 sm:py-20">
        <Container>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Em destaque</h2>
            <Link href="/produtos" className="text-sm font-semibold text-navy hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Categorias</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categorias/${category.slug}`}
                className="rounded-2xl border border-line p-6 transition-colors hover:border-navy/40"
              >
                <h3 className="text-sm font-semibold text-ink">{category.name}</h3>
                <p className="mt-2 text-xs text-ink-soft">{category.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface py-14 sm:py-20">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Perguntas frequentes</h2>
          <div className="mt-8">
            <Accordion items={faqItems.slice(0, 4)} />
          </div>
          <Link href="/faq" className="mt-6 inline-block text-sm font-semibold text-navy hover:underline">
            Ver todas as perguntas →
          </Link>
        </Container>
      </section>
    </>
  );
}
