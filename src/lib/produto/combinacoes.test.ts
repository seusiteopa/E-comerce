import { describe, expect, it } from "vitest";
import { attrsKey, combinationsFromGroups, findVariation } from "./combinacoes";

const groups = [
  { name: "Cor", mode: "escolha" as const, options: [{ name: "Preta" }, { name: "Vermelha" }] },
  { name: "Tamanho", mode: "escolha" as const, options: [{ name: "M" }, { name: "G" }] },
  { name: "Adicionais", mode: "multipla" as const, options: [{ name: "Bacon" }] },
];

describe("combinationsFromGroups", () => {
  it("gera Cor × Tamanho, ignorando os adicionais", () => {
    const combos = combinationsFromGroups(groups);
    expect(combos).toHaveLength(4);
    expect(combos).toContainEqual({ Cor: "Preta", Tamanho: "G" });
    expect(combos.every((c) => !("Adicionais" in c))).toBe(true);
  });
  it("sem grupos de escolha, há uma combinação vazia", () => {
    expect(combinationsFromGroups([])).toEqual([{}]);
  });
});

describe("findVariation", () => {
  const variations = [
    { id: "a", attributes: { Cor: "Preta", Tamanho: "G" }, stock: 4 },
    { id: "b", attributes: { Tamanho: "M", Cor: "Vermelha" }, stock: 10 },
  ];
  it("acha a combinação independente da ordem dos campos", () => {
    expect(findVariation(variations, { Cor: "Vermelha", Tamanho: "M" })?.id).toBe("b");
  });
  it("não acha combinação que não existe", () => {
    expect(findVariation(variations, { Cor: "Preta", Tamanho: "M" })).toBeUndefined();
  });
  it("chave é estável", () => {
    expect(attrsKey({ b: "2", a: "1" })).toBe("a=1|b=2");
  });
});
