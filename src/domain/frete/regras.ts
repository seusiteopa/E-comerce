import { ProductType } from "@/types";

/** Só produtos físicos acionam cálculo de frete (Etapa 1/4/7). */
export function cartNeedsShippingCalculation(itemTypes: ProductType[]): boolean {
  return itemTypes.includes("fisico");
}

/**
 * Regra de frete grátis acima de um valor mínimo — placeholder até a
 * confirmação pendente da Etapa 3 (pergunta #3: cupom x frete grátis).
 * Mantido como constante isolada para fácil ajuste sem tocar em outras
 * partes do sistema.
 */
const FREE_SHIPPING_MIN_SUBTOTAL = 250;

export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_MIN_SUBTOTAL;
}
