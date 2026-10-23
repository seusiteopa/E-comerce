import { describe, expect, it } from "vitest";
import { interleaveSponsored, pickTopSponsored } from "./sponsored";

const s = (id: string) => ({ storeId: id });

describe("pickTopSponsored", () => {
  it("gira a ordem a cada visita", () => {
    const list = [s("a"), s("b"), s("c")];
    expect(pickTopSponsored(list, 0).map((x) => x.storeId)).toEqual(["a", "b", "c"]);
    expect(pickTopSponsored(list, 1).map((x) => x.storeId)).toEqual(["b", "c", "a"]);
  });
  it("limita a 4 lojas no topo", () => {
    const list = [s("a"), s("b"), s("c"), s("d"), s("e")];
    expect(pickTopSponsored(list, 0)).toHaveLength(4);
  });
  it("sem patrocinadores, retorna vazio", () => {
    expect(pickTopSponsored([], 3)).toEqual([]);
  });
  it("não repete a mesma loja", () => {
    expect(pickTopSponsored([s("a"), s("a")], 0)).toHaveLength(1);
  });
});

describe("interleaveSponsored", () => {
  const products = Array.from({ length: 12 }, (_, i) => ({ storeId: "x", id: i }));

  it("coloca um patrocinado a cada 6 produtos", () => {
    const out = interleaveSponsored(products, [s("p1")], 0);
    expect(out.map((o) => o.kind)).toEqual([
      ...Array(6).fill("product"), "sponsored", ...Array(6).fill("product"), "sponsored",
    ]);
  });
  it("sem patrocinadores, mantém só os produtos", () => {
    const out = interleaveSponsored(products, [], 0);
    expect(out).toHaveLength(12);
    expect(out.every((o) => o.kind === "product")).toBe(true);
  });
  it("não repete a mesma loja patrocinada em posições seguidas", () => {
    const out = interleaveSponsored(products, [s("p1"), s("p2")], 0);
    const sponsoredIds = out.filter((o) => o.kind === "sponsored").map((o) => (o.item as { storeId: string }).storeId);
    expect(sponsoredIds[0]).not.toBe(sponsoredIds[1]);
  });
});
