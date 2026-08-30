import { Product } from "@/types";

/** Preço efetivo do produto (considera promoção). */
export function getEffectivePrice(product: Product): number {
  return product.promoPrice ?? product.price;
}

/** Produto físico está esgotado quando todas as variações têm estoque zero. */
export function isOutOfStock(product: Product): boolean {
  if (product.type !== "fisico") return false;
  if (!product.variations || product.variations.length === 0) return true;
  return product.variations.every((v) => v.stock === 0);
}

/**
 * Rótulo do CTA principal por tipo de produto — regra de UX
 * centralizada aqui para reuso entre front-end e, futuramente, e-mail
 * transacional (ex: "seu pedido de X foi confirmado").
 */
export function getPrimaryActionLabel(product: Product): string {
  const labels: Record<Product["type"], string> = {
    fisico: "Adicionar ao carrinho",
    digital: "Comprar agora",
  };
  return labels[product.type];
}
