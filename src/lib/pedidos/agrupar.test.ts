import { describe, expect, it } from "vitest";
import { groupOrderLines } from "./agrupar";

describe("groupOrderLines", () => {
  it("separa por tipo, na ordem físicos, digitais, cursos", () => {
    const sections = groupOrderLines([
      { name: "E-book", quantity: 1, unitPrice: 20, type: "digital" },
      { name: "Camisa", quantity: 2, unitPrice: 80, type: "fisico" },
      { name: "Curso X", quantity: 1, unitPrice: 199, type: "curso" },
    ]);
    expect(sections.map((s) => s.key)).toEqual(["fisico", "digital", "curso"]);
    expect(sections[0].lines[0].name).toBe("Camisa");
  });
  it("não mostra seções vazias", () => {
    const sections = groupOrderLines([{ name: "E-book", quantity: 1, unitPrice: 20, type: "digital" }]);
    expect(sections.map((s) => s.label)).toEqual(["Produtos digitais"]);
  });
});
