import { describe, expect, it } from "vitest";
import { allowedProductTypes, resolveCategoryType } from "./product-types";

describe("allowedProductTypes", () => {
  it("segue o tipo da loja", () => {
    expect(allowedProductTypes("loja")).toEqual(["fisico"]);
    expect(allowedProductTypes("restaurante")).toEqual(["fisico"]);
    expect(allowedProductTypes("digital")).toEqual(["digital"]);
    expect(allowedProductTypes("curso")).toEqual(["digital"]);
    expect(allowedProductTypes("misto")).toEqual(["fisico", "digital"]);
  });
});

describe("resolveCategoryType", () => {
  it("em loja virtual, categoria é sempre digital, mesmo se pedirem físico", () => {
    expect(resolveCategoryType("digital", "fisico")).toBe("digital");
    expect(resolveCategoryType("digital", undefined)).toBe("digital");
  });
  it("em loja física, categoria é sempre física", () => {
    expect(resolveCategoryType("loja", "digital")).toBe("fisico");
  });
  it("em loja mista respeita a escolha", () => {
    expect(resolveCategoryType("misto", "digital")).toBe("digital");
    expect(resolveCategoryType("misto", "fisico")).toBe("fisico");
  });
});
