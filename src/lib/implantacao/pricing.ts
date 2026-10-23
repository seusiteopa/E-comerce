/** Faixas da criação assistida: taxa única conforme a quantidade de produtos a cadastrar. */
export const SETUP_TIERS = [
  { maxProducts: 20, feeCents: 30000 },
  { maxProducts: 60, feeCents: 60000 },
  { maxProducts: 150, feeCents: 100000 },
] as const;

/** Taxa em centavos para a quantidade de produtos. Acima de 150, o valor é sob consulta (null). */
export function setupFeeCents(productCount: number): number | null {
  if (!Number.isFinite(productCount) || productCount < 0) return null;
  const tier = SETUP_TIERS.find((t) => productCount <= t.maxProducts);
  return tier ? tier.feeCents : null;
}
