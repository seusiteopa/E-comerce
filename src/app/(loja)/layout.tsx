import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CartAddedToast from "@/components/loja/CartAddedToast";
import WelcomeCouponPopup from "@/components/loja/WelcomeCouponPopup";
import { getSiteSettings } from "@/lib/data/site-settings";

// As configurações do site (logo, nome, faixa institucional) não mudam a
// cada segundo — revalida a cada 5 minutos em vez de buscar do banco em
// toda requisição de toda página da loja.
export const revalidate = 300;

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const phrases = [
    settings.announcement_phrase_1,
    settings.announcement_phrase_2,
    settings.announcement_phrase_3,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return (
    <>
      <AnnouncementBar phrases={phrases} />
      <Header logoUrl={settings.logo_url} siteName={settings.site_name} />
      <main id="conteudo-principal">{children}</main>
      <Footer />
      <CartAddedToast />
      <WelcomeCouponPopup couponCode={settings.popup_coupon_code} message={settings.popup_coupon_message} />
    </>
  );
}
