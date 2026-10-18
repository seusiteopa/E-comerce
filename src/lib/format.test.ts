import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formata em reais com vírgula decimal", () => {
    expect(formatCurrency(0.01)).toMatch(/R\$\s?0,01/);
    expect(formatCurrency(1234.5)).toMatch(/R\$\s?1\.234,50/);
  });
});
