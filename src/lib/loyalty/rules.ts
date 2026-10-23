/** Níveis de fidelidade: a cada marco de compras pagas na mesma loja, o cliente ganha um cupom. */
export const LOYALTY_TIERS = [
  { paidOrders: 2, discountPct: 10, validDays: 30 },
  { paidOrders: 5, discountPct: 15, validDays: 30 },
] as const;

export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

/**
 * Se a contagem de compras pagas chegou exatamente num marco, retorna o nível que deve ser premiado.
 * Só premia no momento do marco: a mesma pessoa não ganha o mesmo cupom duas vezes.
 */
export function loyaltyTierForPaidCount(paidOrderCount: number): LoyaltyTier | null {
  return LOYALTY_TIERS.find((tier) => tier.paidOrders === paidOrderCount) ?? null;
}
