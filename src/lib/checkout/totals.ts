/** Arredonda para centavos (evita erros de ponto flutuante, ex.: 0.1 + 0.2). */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Total do pedido = produtos + frete − desconto.
 * O desconto nunca pode deixar o total negativo, e o resultado sempre tem centavos exatos.
 */
export function calculateOrderTotal(input: { subtotal: number; shipping: number; discount: number }): number {
  const gross = roundCents(input.subtotal + input.shipping);
  const discount = Math.min(Math.max(roundCents(input.discount), 0), gross);
  return roundCents(gross - discount);
}

/** Cupom só vale enquanto o subtotal for o mesmo em que foi aplicado. */
export function couponStillApplies(appliedSubtotal: number | null, currentSubtotal: number): boolean {
  return appliedSubtotal !== null && roundCents(appliedSubtotal) === roundCents(currentSubtotal);
}
