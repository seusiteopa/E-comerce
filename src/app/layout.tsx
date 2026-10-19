import { storeBasePath } from "@/lib/store/base-path";
import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { siteConfig, contact } from "@/data/site";
import PwaManager from "@/components/PwaManager";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getActiveBanners } from "@/lib/data/banners";
import { getCurrentStore, getRequestOrigin, type CurrentStore } from "@/lib/store/current";

// viewport-fit=cover libera a área por baixo do notch/câmera-furo para o
// CSS usar (env(safe-area-inset-*)), necessário pro app rodar em modo
// standalone (instalado) sem conteúdo cortado em aparelhos com notch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#173F82",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, store, origin, base] = await Promise.all([getSiteSettings(), getCurrentStore(), getRequestOrigin(), storeBasePath()]);
  const storeName = settings.site_name?.trim() || store.name || siteConfig.storeName;
  // Loja de cliente: nunca cai na descrição da plataforma; usa o que a própria loja escreveu, ou um texto com o nome dela.
  const description =
    settings.site_description?.trim() ||
    store.og_description ||
    store.description ||
    (store.is_platform_owned ? siteConfig.description : `Compre na ${storeName}.`);
  // A loja da própria plataforma mantém o slogan da marca; as demais usam só o nome (ou o título de OG que o lojista definiu).
  const pageTitle = store.og_title?.trim() || (store.is_platform_owned ? `${storeName} | ${siteConfig.tagline}` : storeName);

  // Primeira foto do banner "principal" vira a imagem de compartilhamento
  // da home — se não tiver banner (ou só tiver vídeo), cai pro padrão.
  const banners = await getActiveBanners("principal").catch(() => []);
  const firstBannerPhoto = banners.find((b) => b.media_type !== "video");
  // Prioridade da imagem de compartilhamento: imagem OG da loja > 1ª foto do banner > padrão da plataforma.
  // Prioridade: imagem OG da loja > 1ª foto do banner > logo da loja > imagem gerada com o nome da loja.
  // A loja da plataforma mantém a imagem padrão da marca.
  const ogImage = store.og_image_url
    ? { url: store.og_image_url, alt: storeName }
    : firstBannerPhoto
      ? { url: firstBannerPhoto.image_url, alt: storeName }
      : store.logo_url
        ? { url: store.logo_url, alt: storeName }
        : store.is_platform_owned
          ? { url: "/social/og-image.png", width: 1200, height: 630, alt: storeName }
          : { url: `${base}/opengraph-image`, width: 1200, height: 630, alt: storeName };

  return {
    metadataBase: new URL(origin),
    title: {
      default: pageTitle,
      template: `%s | ${storeName}`,
    },
    description,
    alternates: {
      canonical: base || "/",
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    // Open Graph — controla como o link aparece ao ser compartilhado no
    // WhatsApp/Instagram/Facebook (canal de contato confirmado no briefing).
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: storeName,
      title: pageTitle,
      description,
      url: `${origin}${base}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
    },
    appleWebApp: {
      capable: true,
      title: storeName,
      statusBarStyle: "black-translucent",
    },
  };
}

/**
 * Dados estruturados (Schema.org / JSON-LD) — Organization + WebSite.
 * Ajuda buscadores a entender a entidade por trás do site (nome, logo,
 * canais oficiais) e habilita a sitelinks search box em resultados do
 * Google quando aplicável. Marcação de Product/Offer fica para quando as
 * páginas de produto existirem de fato (Etapa 8/11) — não faz sentido
 * declarar Schema de produto para uma página que ainda não existe.
 */
function OrganizationJsonLd({ store, origin }: { store: CurrentStore; origin: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: store.name,
        url: origin,
        logo: store.logo_url ?? `${origin}/brand/vecorion-icone-navy-transparente.png`,
        ...(store.is_platform_owned ? { sameAs: [contact.instagram] } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: store.name,
        publisher: { "@id": `${origin}/#organization` },
        inLanguage: "pt-BR",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [store, origin] = await Promise.all([getCurrentStore(), getRequestOrigin()]);
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        <OrganizationJsonLd store={store} origin={origin} />
        <PwaManager />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
