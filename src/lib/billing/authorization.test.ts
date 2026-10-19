import { describe, expect, it } from "vitest";
import { isStoreAuthorized } from "./authorization";

describe("isStoreAuthorized", () => {
  it("libera a loja com assinatura em teste (1º mês grátis) ou ativa", () => {
    expect(isStoreAuthorized({ subscription_status: "em_teste" })).toBe(true);
    expect(isStoreAuthorized({ subscription_status: "ativa" })).toBe(true);
  });

  it("bloqueia loja pendente, pausada ou sem assinatura", () => {
    expect(isStoreAuthorized({ subscription_status: "pendente" })).toBe(false);
    expect(isStoreAuthorized({ subscription_status: "inadimplente" })).toBe(false);
    expect(isStoreAuthorized({ subscription_status: null })).toBe(false);
    expect(isStoreAuthorized(null)).toBe(false);
  });

  it("libera loja marcada pelo dono da plataforma, mesmo sem assinatura", () => {
    expect(isStoreAuthorized({ subscription_status: "pendente", painel_liberado: true })).toBe(true);
  });
});
