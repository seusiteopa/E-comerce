import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/data/site";
import { DEFAULT_STORE_SLUG, cleanHost, parseStoreHost } from "@/lib/store/host";

export interface CurrentStore {
  id: string;
  slug: string;
  name: string;
  store_type: string;
  description: string | null;
  logo_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  whatsapp: string | null;
  custom_domain: string | null;
  status: "ativa" | "pausada";
  is_platform_owned: boolean;
}

const STORE_SELECT =
  "id, slug, name, store_type, description, logo_url, og_title, og_description, og_image_url, whatsapp, custom_domain, status, is_platform_owned";

function routedSlugOrNull(h: Headers): string | null {
  return h.get("x-store-slug");
}

export const getCurrentStore = cache(async (): Promise<CurrentStore> => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  // Cabeçalho definido só pelo proxy (rotas /lojas/<loja>/...); o proxy remove o que o cliente enviar.
  const { slug: hostSlug, domain } = parseStoreHost(host);
  const slug = h.get("x-store-slug") || hostSlug;

  const supabase = await createSupabaseServerClient();

  if (slug) {
    const { data } = await supabase.from("stores").select(STORE_SELECT).eq("slug", slug).maybeSingle();
    if (data) return data as CurrentStore;
    // Loja informada pela rota /lojas/<loja> que não existe: 404, sem cair na loja padrão.
    if (routedSlugOrNull(h)) notFound();
  }
  if (domain) {
    const { data } = await supabase.from("stores").select(STORE_SELECT).eq("custom_domain", domain).maybeSingle();
    if (data) return data as CurrentStore;
  }

  const { data: fallback, error } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("slug", DEFAULT_STORE_SLUG)
    .maybeSingle();
  if (error || !fallback) {
    throw new Error("Nenhuma loja encontrada para este endereço e a loja padrão não está cadastrada.");
  }
  return fallback as CurrentStore;
});

/** Endereço público (https://dominio) da requisição atual — usado em OG, sitemap e robots. */
export const getRequestOrigin = cache(async (): Promise<string> => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteConfig.url;
  const isLocal = cleanHost(host) === "localhost";
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
});
