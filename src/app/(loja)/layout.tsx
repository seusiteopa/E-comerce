import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar, { ANNOUNCEMENT_BAR_HEIGHT } from "@/components/layout/AnnouncementBar";
import StickyHeaderWrapper from "@/components/layout/StickyHeaderWrapper";
import CartAddedToast from "@/components/loja/CartAddedToast";
import WelcomeCouponPopup from "@/components/loja/WelcomeCouponPopup";
import ThemeOverride from "@/components/layout/ThemeOverride";
import { getSiteSettings } from "@/lib/data/site-settings";

// As configurações do site (logo, nome, faixa institucional) não mudam a
// cada segundo — revalida a cada 5 minutos em vez de buscar do banco em
// toda requisição de toda página da loja.
export const revalidate = 300;

const HEADER_HEIGHT = 64;

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const phrases = [
    settings.announcement_phrase_1,
    settings.announcement_phrase_2,
    settings.announcement_phrase_3,
  ].filter((p): p is string => Boolean(p && p.trim()));
  const hasAnnouncementBar = phrases.length > 0;
  const topPadding = HEADER_HEIGHT + (hasAnnouncementBar ? ANNOUNCEMENT_BAR_HEIGHT : 0);

  return (
    <>
      <ThemeOverride primaryColor={settings.theme_primary_color} accentColor={settings.theme_accent_color} />
      <AnnouncementBar phrases={phrases} />
      <StickyHeaderWrapper hasAnnouncementBar={hasAnnouncementBar}>
        <Header logoUrl={settings.logo_url} siteName={settings.site_name} />
      </StickyHeaderWrapper>
      <main id="conteudo-principal" style={{ paddingTop: topPadding }}>
        {children}
      </main>
      <Footer />
      <CartAddedToast />
      <WelcomeCouponPopup couponCode={settings.popup_coupon_code} message={settings.popup_coupon_message} />
    </>
  );
}
