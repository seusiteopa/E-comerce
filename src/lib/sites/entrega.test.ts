import { describe, expect, it } from "vitest";
import { validateSiteDelivery } from "./entrega";

const ok = "<!doctype html><html><body>oi</body></html>";

describe("validateSiteDelivery", () => {
  it("aceita endereço e HTML certos", () => {
    expect(validateSiteDelivery("joao-padaria", ok)).toBeNull();
  });
  it("recusa endereço inválido", () => {
    expect(validateSiteDelivery("Joao Padaria", ok)).toMatch(/minúsculas/);
    expect(validateSiteDelivery("ab", ok)).toMatch(/entre 3/);
    expect(validateSiteDelivery("-abc", ok)).toMatch(/minúsculas/);
  });
  it("recusa arquivo que não é HTML completo", () => {
    expect(validateSiteDelivery("site-novo", "só texto")).toMatch(/HTML completo/);
    expect(validateSiteDelivery("site-novo", "   ")).toMatch(/vazio/);
  });
  it("recusa arquivo grande demais", () => {
    expect(validateSiteDelivery("site-novo", "<html>" + "x".repeat(500_001))).toMatch(/500 KB/);
  });
});
