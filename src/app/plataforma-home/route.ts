import { PLATAFORMA_HOME_HTML } from "@/lib/plataforma/home-html";

/** Página inicial da plataforma, com a imagem de compartilhamento própria e o endereço correto. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const imageUrl = `${origin}/plataforma/og-image`;
  const html = PLATAFORMA_HOME_HTML
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${origin}/">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
