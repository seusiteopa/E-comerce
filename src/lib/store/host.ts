export const DEFAULT_STORE_SLUG = process.env.DEFAULT_STORE_SLUG || "vecorion";

/**
 * Identificação da loja pelo endereço — funções puras (sem acesso a banco),
 * usadas tanto pelo servidor quanto pelo proxy.
 */

export function cleanHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Como o endereço identifica a loja:
 *  1. subdomínio do domínio da plataforma (ex.: minhaloja.PLATFORM_ROOT_DOMAIN)
 *  2. domínio próprio cadastrado na loja (stores.custom_domain)
 *  3. loja padrão (DEFAULT_STORE_SLUG), para localhost e previews
 * O endereço NUNCA vem de um campo enviado pelo navegador no corpo da requisição.
 */
export function parseStoreHost(host: string): { slug?: string; domain?: string } {
  const hostname = cleanHost(host);
  const root = process.env.PLATFORM_ROOT_DOMAIN?.toLowerCase();

  if (root && hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, -(root.length + 1));
    if (sub && sub !== "www" && !sub.includes(".")) return { slug: sub };
  }

  const isLocal = hostname === "localhost" || hostname.endsWith(".localhost") || /^[\d.]+$/.test(hostname);
  const isPreview = hostname.endsWith(".netlify.app");
  if (!isLocal && !isPreview && hostname !== root) {
    return { domain: hostname.replace(/^www\./, "") };
  }
  return {};
}


/**
 * Endereço da plataforma (sem loja): o domínio raiz (PLATFORM_ROOT_DOMAIN)
 * e os endereços *.netlify.app, que não têm subdomínio de loja.
 * Quem está nesses endereços vê a home da plataforma, não uma loja.
 */
export function isPlatformRootHost(host: string): boolean {
  const hostname = cleanHost(host);
  const root = process.env.PLATFORM_ROOT_DOMAIN?.toLowerCase();
  if (root && hostname === root) return true;
  if (hostname.endsWith(".netlify.app")) return !parseStoreHost(host).slug;
  return false;
}
