import { describe, expect, it } from "vitest";
import { briefSchema, normalizeWhatsapp, whatsappLink } from "./schema";

const ok = { kind: "site", name: "Maria", whatsapp: "(19) 99189-2801", description: "Quero um site para a minha loja." };

describe("normalizeWhatsapp", () => {
  it("acrescenta 55 quando vem só com DDD", () => {
    expect(normalizeWhatsapp("(19) 99189-2801")).toBe("5519991892801");
  });
  it("não repete o 55", () => {
    expect(normalizeWhatsapp("+55 19 99189-2801")).toBe("5519991892801");
  });
});

describe("briefSchema", () => {
  it("aceita um pedido completo", () => {
    const r = briefSchema.safeParse(ok);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.whatsapp).toBe("5519991892801");
  });
  it("recusa tipo desconhecido, WhatsApp curto e descrição vazia", () => {
    expect(briefSchema.safeParse({ ...ok, kind: "outro" }).success).toBe(false);
    expect(briefSchema.safeParse({ ...ok, whatsapp: "123" }).success).toBe(false);
    expect(briefSchema.safeParse({ ...ok, description: "oi" }).success).toBe(false);
  });
  it("e-mail é opcional, mas se vier precisa ser válido", () => {
    expect(briefSchema.safeParse({ ...ok, email: "" }).success).toBe(true);
    expect(briefSchema.safeParse({ ...ok, email: "maria@x.com" }).success).toBe(true);
    expect(briefSchema.safeParse({ ...ok, email: "maria" }).success).toBe(false);
  });
});

describe("whatsappLink", () => {
  it("monta o link do WhatsApp", () => {
    expect(whatsappLink("19991892801")).toBe("https://wa.me/5519991892801");
  });
});
