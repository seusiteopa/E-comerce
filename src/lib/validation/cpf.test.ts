import { describe, expect, it } from "vitest";
import { isValidCpf } from "./cpf";

describe("isValidCpf", () => {
  it("aceita CPF válido, com ou sem pontuação", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("recusa CPF com dígitos errados, repetidos ou tamanho errado", () => {
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("1234")).toBe(false);
  });
});
