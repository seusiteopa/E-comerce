export const TOP_SLOTS = 4;
export const EVERY_N_PRODUCTS = 6;

/**
 * Escolhe as lojas patrocinadas do topo. Gira a ordem a cada visita (índice `rotation`),
 * para que nenhuma loja fique sempre na frente. Limita a TOP_SLOTS.
 */
export function pickTopSponsored<T extends { storeId: string }>(sponsored: T[], rotation: number): T[] {
  if (sponsored.length === 0) return [];
  const unique = [...new Map(sponsored.map((s) => [s.storeId, s])).values()];
  const start = ((rotation % unique.length) + unique.length) % unique.length;
  const rotated = [...unique.slice(start), ...unique.slice(0, start)];
  return rotated.slice(0, TOP_SLOTS);
}

/**
 * Intercala os cards patrocinados entre os produtos comuns: um a cada EVERY_N_PRODUCTS.
 * Uma loja patrocinada nunca aparece duas vezes seguidas. Se não houver patrocinador, devolve a lista original.
 */
export function interleaveSponsored<P extends { storeId: string }, S extends { storeId: string }>(
  products: P[],
  sponsored: S[],
  rotation: number
): Array<{ kind: "product"; item: P } | { kind: "sponsored"; item: S }> {
  const out: Array<{ kind: "product"; item: P } | { kind: "sponsored"; item: S }> = [];
  if (sponsored.length === 0) return products.map((item) => ({ kind: "product" as const, item }));
  let s = 0;
  products.forEach((item, index) => {
    out.push({ kind: "product", item });
    if ((index + 1) % EVERY_N_PRODUCTS === 0) {
      let pick = sponsored[(s + rotation) % sponsored.length];
      // evita repetir a mesma loja patrocinada seguida
      if (sponsored.length > 1 && out.length >= 2) {
        const prevSponsored = [...out].reverse().find((x) => x.kind === "sponsored");
        if (prevSponsored && prevSponsored.item.storeId === pick.storeId) {
          pick = sponsored[(s + rotation + 1) % sponsored.length];
        }
      }
      out.push({ kind: "sponsored", item: pick });
      s++;
    }
  });
  return out;
}

/** Ponto de partida da rotação a cada visita (chamado no servidor, fora da renderização). */
export function visitRotation(): number {
  return Math.floor(Math.random() * 1000);
}
