import { describe, expect, it } from "vitest";
import { buildCatalogText } from "./text";

describe("buildCatalogText", () => {
  it("lista cada produto com preço e link", () => {
    const text = buildCatalogText({
      storeName: "Lanche",
      products: [{ name: "X-Burger", price: 25, url: "https://vecorion.netlify.app/lojas/lanche/produtos/x-burger" }],
    });
    expect(text).toBe(
      "Catálogo Lanche\n\n• X-Burger — R$ 25,00\n  https://vecorion.netlify.app/lojas/lanche/produtos/x-burger"
    );
  });

  it("mostra o preço promocional com o preço de antes", () => {
    const text = buildCatalogText({
      storeName: "Loja",
      products: [{ name: "Camiseta", price: 80, promoPrice: 60, url: "https://x/y" }],
    });
    expect(text).toContain("R$ 60,00 (de R$ 80,00)");
  });

  it("ignora promoção que não é menor que o preço", () => {
    const text = buildCatalogText({
      storeName: "Loja",
      products: [{ name: "Caneca", price: 30, promoPrice: 40, url: "https://x/z" }],
    });
    expect(text).toContain("R$ 30,00");
    expect(text).not.toContain("de R$");
  });

  it("loja sem produtos ativos mostra só o cabeçalho", () => {
    expect(buildCatalogText({ storeName: "Vazia", products: [] })).toBe("Catálogo Vazia\n");
  });
});
