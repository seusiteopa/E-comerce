/** Blocos da página inicial da loja que o lojista pode reordenar. */
export const HOME_SECTIONS = ["banner", "secundarios", "destaques", "catalogo"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export const HOME_SECTION_LABELS: Record<HomeSection, string> = {
  banner: "Banner principal",
  secundarios: "Banners secundários",
  destaques: "Destaques",
  catalogo: "Catálogo de produtos",
};

/** Converte o texto salvo (ex.: "destaques,banner,catalogo,secundarios") na ordem válida. Blocos faltando vão para o fim. */
export function resolveHomeOrder(raw?: string): HomeSection[] {
  const picked = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is HomeSection => (HOME_SECTIONS as readonly string[]).includes(s));
  const unique = [...new Set(picked)];
  const missing = HOME_SECTIONS.filter((s) => !unique.includes(s));
  return [...unique, ...missing];
}
