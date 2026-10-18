import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanHost, isPlatformRootHost, parseStoreHost } from "./host";

describe("cleanHost", () => {
  it("remove a porta e deixa em minúsculas", () => {
    expect(cleanHost("Lanche.Vecorion.com.br:443")).toBe("lanche.vecorion.com.br");
  });
});

describe("identificação da loja pelo endereço", () => {
  beforeEach(() => {
    vi.stubEnv("PLATFORM_ROOT_DOMAIN", "vecorion.com.br");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("subdomínio da plataforma identifica a loja", () => {
    expect(parseStoreHost("lanche.vecorion.com.br")).toEqual({ slug: "lanche" });
  });

  it("www do domínio da plataforma é tratado como domínio próprio sem o www (sem loja cadastrada, cai na loja padrão)", () => {
    expect(parseStoreHost("www.vecorion.com.br")).toEqual({ domain: "vecorion.com.br" });
  });

  it("domínio próprio identifica a loja pelo domínio", () => {
    expect(parseStoreHost("www.minhaloja.com.br")).toEqual({ domain: "minhaloja.com.br" });
  });

  it("previews e localhost não identificam loja por domínio", () => {
    expect(parseStoreHost("feat-x--vecorion.netlify.app")).toEqual({});
    expect(parseStoreHost("localhost:3000")).toEqual({});
  });
});

describe("isPlatformRootHost", () => {
  beforeEach(() => {
    vi.stubEnv("PLATFORM_ROOT_DOMAIN", "vecorion.com.br");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("domínio raiz e previews da plataforma são o endereço da plataforma", () => {
    expect(isPlatformRootHost("vecorion.com.br")).toBe(true);
    expect(isPlatformRootHost("vecorion.netlify.app")).toBe(true);
  });

  it("subdomínio de loja não é o endereço da plataforma", () => {
    expect(isPlatformRootHost("lanche.vecorion.com.br")).toBe(false);
  });
});
