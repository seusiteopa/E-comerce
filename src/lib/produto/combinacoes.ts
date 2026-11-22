/** Combinações de estoque: cada combinação das opções de escolha única (ex.: Cor × Tamanho) tem a sua quantidade. */
export type Attrs = Record<string, string>;
export type ChoiceGroup = { name: string; mode: "escolha" | "multipla"; options: { name: string }[] };

/** Gera todas as combinações dos grupos de escolha única. Sem grupos de escolha, devolve uma combinação vazia. */
export function combinationsFromGroups(groups: ChoiceGroup[]): Attrs[] {
  const choice = groups.filter((g) => g.mode === "escolha" && g.options.length > 0);
  let combos: Attrs[] = [{}];
  for (const g of choice) {
    const next: Attrs[] = [];
    for (const base of combos) for (const o of g.options) next.push({ ...base, [g.name]: o.name });
    combos = next;
  }
  return combos;
}

/** Chave estável para comparar combinações, independente da ordem dos campos. */
export function attrsKey(attrs: Attrs): string {
  return Object.keys(attrs).sort().map((k) => `${k}=${attrs[k]}`).join("|");
}

/** Acha a variação (combinação) que bate exatamente com as escolhas do cliente. */
export function findVariation<T extends { attributes: Attrs }>(variations: T[], attrs: Attrs): T | undefined {
  const key = attrsKey(attrs);
  return variations.find((v) => attrsKey(v.attributes) === key);
}
