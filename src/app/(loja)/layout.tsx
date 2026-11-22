import { getVitrineColumns } from "@/lib/store/vitrine-columns";
import { getCurrentStore } from "@/lib/store/current";
import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import CartDrawer from "@/components/loja/CartDrawer";
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
  const currentStore = await getCurrentStore();
  const cols = await getVitrineColumns(currentStore.id);
  if (currentStore.status === "encerrada") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-ink">Esta loja está encerrada</h1>
          <p className="mt-3 text-sm text-ink-soft">No momento ela não está recebendo pedidos. Volte mais tarde.</p>
        </div>
      </div>
    );
  }
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
      <main id="conteudo-principal" data-vitrine-cols={cols} style={{ paddingTop: "var(--site-chrome-height, 96px)" }}>
        {children}
      </main>
      <Footer settings={settings} />
      <CartDrawer />
      <WelcomeCouponPopup couponCode={settings.popup_coupon_code} message={settings.popup_coupon_message} />
    </>
    </StoreBaseProvider>
  );
}
