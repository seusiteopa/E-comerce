import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import { getSiteSettings } from "@/lib/data/site-settings";

export const revalidate = 300;

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const phrases = [
    settings.announcement_phrase_1,
    settings.announcement_phrase_2,
    settings.announcement_phrase_3,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return (
    <>
      <SiteChrome phrases={phrases} logoUrl={settings.logo_url} siteName={settings.site_name} />
      <main id="conteudo-principal" style={{ paddingTop: "var(--site-chrome-height, 96px)" }}>
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
