import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import { getSiteSettings } from "@/lib/data/site-settings";
import { siteConfig } from "@/data/site";


export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const phrases = [
    settings.announcement_phrase_1,
    settings.announcement_phrase_2,
    settings.announcement_phrase_3,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return (
    <>
      {/* A área da conta pertence à plataforma: mostra a marca da plataforma, não a da loja atual. */}
      <SiteChrome phrases={phrases} logoUrl={undefined} siteName={siteConfig.storeName} />
      <main id="conteudo-principal" style={{ paddingTop: "var(--site-chrome-height, 96px)" }}>
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
