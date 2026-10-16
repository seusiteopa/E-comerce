import "server-only";
import { getRequestOrigin } from "@/lib/store/current";

interface StoreAddress {
  slug: string;
  custom_domain: string | null;
}

/** Endereço público de uma loja (domínio próprio > subdomínio da plataforma > endereço atual). */
export async function storeOrigin(store: StoreAddress): Promise<string> {
  if (store.custom_domain) return `https://${store.custom_domain}`;
  const root = process.env.PLATFORM_ROOT_DOMAIN;
  if (root) return `https://${store.slug}.${root}`;
  return getRequestOrigin();
}

/** Endereço central da plataforma (callbacks do Mercado Pago, cadastro de lojas). */
export function platformOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");
  return url.replace(/\/$/, "");
}
