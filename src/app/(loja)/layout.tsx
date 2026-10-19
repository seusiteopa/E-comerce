import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import CartAddedToast from "@/components/loja/CartAddedToast";
import WelcomeCouponPopup from "@/components/loja/WelcomeCouponPopup";
import ThemeOverride from "@/components/layout/ThemeOverride";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getHeaderUser } from "@/lib/auth/header-user";
import { StoreBaseProvider } from "@/components/store/StoreLink";
import { storeBasePath } from "@/lib/store/base-path";

// As configurações do site (logo, nome, faixa institucional) não mudam a
// cada segundo — revalida a cada 5 minutos em vez de buscar do banco em
// toda requisição de toda página da loja.

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const headerUser = await getHeaderUser();
  const base = await storeBasePath();
  const phrases = [
    settings.announcement_phrase_1,
    settings.announcement_phrase_2,
    settings.announcement_phrase_3,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return (
    <StoreBaseProvider value={base}>
    <>
      <ThemeOverride primaryColor={settings.theme_primary_color} accentColor={settings.theme_accent_color} />
      <SiteChrome user={headerUser} phrases={phrases} logoUrl={settings.logo_url} siteName={settings.site_name} />
      <main id="conteudo-principal" style={{ paddingTop: "var(--site-chrome-height, 96px)" }}>
        {children}
      </main>
      <Footer settings={settings} />
      <CartAddedToast />
      <WelcomeCouponPopup couponCode={settings.popup_coupon_code} message={settings.popup_coupon_message} />
    </>
    </StoreBaseProvider>
  );
}
