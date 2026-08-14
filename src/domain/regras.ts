import { Product } from "@/types";

/** Preço efetivo do produto (considera promoção). Sob orçamento não tem preço fixo. */
export function getEffectivePrice(product: Product): number | null {
  if (product.isQuoteOnly) return null;
  return product.promoPrice ?? product.price;
}

/** Um produto está disponível para compra direta (carrinho/checkout) ou só para orçamento? */
export function isDirectPurchase(product: Product): boolean {
  return !product.isQuoteOnly;
}

/** Produto físico está esgotado quando todas as variações têm estoque zero. */
export function isOutOfStock(product: Product): boolean {
  if (product.type !== "fisico") return false;
  if (!product.variations || product.variations.length === 0) return true;
  return product.variations.every((v) => v.stock === 0);
}

/**
 * Rótulo do CTA principal por tipo de produto — regra de UX (Etapa 5)
 * centralizada aqui para reuso entre front-end e, futuramente, e-mail
 * transacional (ex: "seu pedido de X foi confirmado").
 */
export function getPrimaryActionLabel(product: Product): string {
  if (product.isQuoteOnly) return "Solicitar orçamento";
  const labels: Record<Product["type"], string> = {
    fisico: "Adicionar ao carrinho",
    digital: "Comprar agora",
    curso: "Comprar acesso ao curso",
    servico: "Contratar serviço",
  };
  return labels[product.type];
}
