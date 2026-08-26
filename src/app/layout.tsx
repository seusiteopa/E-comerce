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

// viewport-fit=cover libera a área por baixo do notch/câmera-furo para o
// CSS usar (env(safe-area-inset-*)), necessário pro app rodar em modo
// standalone (instalado) sem conteúdo cortado em aparelhos com notch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#173F82",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.storeName} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.storeName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
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
    siteName: siteConfig.storeName,
    title: `${siteConfig.storeName} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: "/social/og-image.png", width: 1200, height: 630, alt: siteConfig.storeName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.storeName} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/social/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.storeName,
    statusBarStyle: "black-translucent",
  },
};

/**
 * Dados estruturados (Schema.org / JSON-LD) — Organization + WebSite.
 * Ajuda buscadores a entender a entidade por trás do site (nome, logo,
 * canais oficiais) e habilita a sitelinks search box em resultados do
 * Google quando aplicável. Marcação de Product/Offer fica para quando as
 * páginas de produto existirem de fato (Etapa 8/11) — não faz sentido
 * declarar Schema de produto para uma página que ainda não existe.
 */
function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/brand/vecorion-icone-navy-transparente.png`,
        sameAs: [contact.instagram],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.storeName,
        publisher: { "@id": `${siteConfig.url}/#organization` },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        <OrganizationJsonLd />
        <PwaManager />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
