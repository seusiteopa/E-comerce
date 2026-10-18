/** Páginas institucionais que cada loja pode escrever (guardadas em site_settings, por loja). */
export const STORE_PAGES = {
  sobre: { key: "page_sobre", title: "Sobre a loja", href: "/sobre" },
  faq: { key: "page_faq", title: "Perguntas frequentes", href: "/faq" },
  contato: { key: "page_contato", title: "Contato", href: "/contato" },
  privacidade: { key: "page_politica_privacidade", title: "Política de Privacidade", href: "/politicas/privacidade" },
  termos: { key: "page_politica_termos", title: "Termos de Uso", href: "/politicas/termos" },
  "trocas-e-devolucao": { key: "page_politica_trocas", title: "Trocas e Devolução", href: "/politicas/trocas-e-devolucao" },
} as const;

export type StorePageSlug = keyof typeof STORE_PAGES;

/** Texto da página para a loja (vazio se a loja não escreveu nada). */
export function storePageText(settings: Record<string, string | undefined> | undefined, slug: StorePageSlug): string {
  return settings?.[STORE_PAGES[slug].key]?.trim() ?? "";
}
