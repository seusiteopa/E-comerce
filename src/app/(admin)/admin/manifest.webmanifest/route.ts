import { NextResponse } from "next/server";

/**
 * Manifesto PWA separado, exclusivo do painel admin. Serve pra permitir que
 * o admin instale um "app" próprio no celular (ícone separado do app da
 * loja), que abre direto em /admin — sem precisar digitar o domínio no
 * navegador toda vez.
 *
 * Servido como route handler (em vez do arquivo especial manifest.ts do
 * Next.js, que cobre só o manifesto raiz do site) pra existir em paralelo
 * ao manifesto da loja, com start_url/scope/nome/ícone diferentes.
 */
export async function GET() {
  return NextResponse.json(
    {
      id: "/admin",
      name: "Vecorion Admin",
      short_name: "Vecorion Admin",
      description: "Painel administrativo da loja Vecorion.",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0A0E17",
      theme_color: "#0A0E17",
      icons: [
        { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
        { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
        { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
        { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
        { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
        { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
