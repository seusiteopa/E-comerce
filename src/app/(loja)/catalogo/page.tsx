import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import CatalogCopyButton from "@/components/loja/CatalogCopyButton";
import { getActiveProducts } from "@/lib/data/catalog";
import { getCurrentStore } from "@/lib/store/current";
import { storeBasePath } from "@/lib/store/base-path";
import { buildCatalogText } from "@/lib/catalog/text";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Todos os produtos da loja, prontos para compartilhar no WhatsApp e no Instagram.",
};

export default async function CatalogoPage() {
  const [store, products, base] = await Promise.all([getCurrentStore(), getActiveProducts(), storeBasePath()]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const lines = products.map((p) => ({
    name: p.name,
    price: p.price,
    promoPrice: p.promo_price ?? null,
    url: `${siteUrl}${base}/produtos/${p.slug}`,
  }));
  const text = buildCatalogText({ storeName: store.name, products: lines });

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Catálogo</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Compartilhe a loja</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-soft">
          Copie a lista abaixo e cole no WhatsApp ou na legenda do Instagram. Cada produto leva direto à página de compra.
        </p>

        <div className="mt-6">
          <CatalogCopyButton text={text} />
        </div>

        <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-line bg-surface p-5 text-sm text-ink">{text}</pre>
      </Container>
    </section>
  );
}
