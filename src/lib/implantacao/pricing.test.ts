import { describe, expect, it } from "vitest";
import { setupFeeCents } from "./pricing";

describe("setupFeeCents", () => {
  it("até 20 produtos: R$ 300", () => {
    expect(setupFeeCents(0)).toBe(30000);
    expect(setupFeeCents(20)).toBe(30000);
  });
  it("de 21 a 60 produtos: R$ 600", () => {
    expect(setupFeeCents(21)).toBe(60000);
    expect(setupFeeCents(60)).toBe(60000);
  });
  it("de 61 a 150 produtos: R$ 1.000", () => {
    expect(setupFeeCents(61)).toBe(100000);
    expect(setupFeeCents(150)).toBe(100000);
  });
  it("acima de 150: sob consulta", () => {
    expect(setupFeeCents(151)).toBeNull();
  });
  it("quantidade inválida não gera valor", () => {
    expect(setupFeeCents(-1)).toBeNull();
    expect(setupFeeCents(Number.NaN)).toBeNull();
  });
});
