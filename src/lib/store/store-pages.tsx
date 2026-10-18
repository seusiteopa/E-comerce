import "server-only";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { getSiteSettings } from "@/lib/data/site-settings";
import { STORE_PAGES, storePageText, type StorePageSlug } from "@/lib/store/store-pages-config";

/**
 * Para lojas de clientes, mostra o texto que o lojista escreveu para a página.
 * Para a plataforma (Vecorion), retorna null e a página original continua.
 * Loja sem texto para a página: 404 (a página não existe para ela).
 */
export async function customStorePage(slug: StorePageSlug) {
  const settings = await getSiteSettings();
  if (settings._platform === "1" || !(slug in STORE_PAGES)) return null;

  const text = storePageText(settings, slug);
  if (!text) notFound();

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionEyebrow>{STORE_PAGES[slug].title}</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">{STORE_PAGES[slug].title}</h1>
        <div className="mt-6 flex flex-col gap-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-base leading-relaxed text-ink-soft">{p}</p>
          ))}
        </div>
      </Container>
    </section>
  );
}
