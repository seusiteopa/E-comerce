export type CatalogLine = { name: string; price: number; promoPrice?: number | null; url: string };

const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

/** Texto pronto para colar no WhatsApp ou no Instagram: uma linha por produto, com preço e link. */
export function buildCatalogText(input: { storeName: string; products: CatalogLine[] }): string {
  const header = `Catálogo ${input.storeName}`;
  const lines = input.products.map((p) => {
    const price = p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price
      ? `${brl(p.promoPrice)} (de ${brl(p.price)})`
      : brl(p.price);
    return `• ${p.name} — ${price}\n  ${p.url}`;
  });
  return [header, "", ...lines].join("\n");
}
