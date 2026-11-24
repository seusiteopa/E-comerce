import { describe, expect, it } from "vitest";
import { withStoreBase } from "./StoreLink";

describe("withStoreBase", () => {
  it("acrescenta o prefixo da loja", () => {
    expect(withStoreBase("/lojas/bom-trigo", "/admin/produtos/novo")).toBe("/lojas/bom-trigo/admin/produtos/novo");
    expect(withStoreBase("/lojas/bom-trigo", "/")).toBe("/lojas/bom-trigo");
  });
  it("não repete o prefixo quando o endereço já tem o da loja", () => {
    expect(withStoreBase("/lojas/bom-trigo", "/lojas/bom-trigo/admin/produtos/novo")).toBe("/lojas/bom-trigo/admin/produtos/novo");
    expect(withStoreBase("/lojas/bom-trigo", "/lojas/bom-trigo")).toBe("/lojas/bom-trigo");
  });
  it("não confunde lojas de nome parecido", () => {
    expect(withStoreBase("/lojas/bom", "/lojas/bom-trigo/produtos")).toBe("/lojas/bom/lojas/bom-trigo/produtos");
  });
  it("sem loja ou em áreas da plataforma, deixa como está", () => {
    expect(withStoreBase("", "/produtos")).toBe("/produtos");
    expect(withStoreBase("/lojas/bom-trigo", "/conta/pedidos")).toBe("/conta/pedidos");
    expect(withStoreBase("/lojas/bom-trigo", "https://exemplo.com")).toBe("https://exemplo.com");
  });
});
