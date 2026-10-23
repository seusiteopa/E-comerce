import { describe, expect, it } from "vitest";
import { deliveryNoticeText } from "./notice";

describe("deliveryNoticeText", () => {
  it("loja que envia para o Brasil todo", () => {
    expect(deliveryNoticeText({ scope: "brasil", baseCity: null, cities: [] })).toBe("Envio para todo o Brasil.");
  });
  it("loja local com cidades atendidas", () => {
    expect(deliveryNoticeText({ scope: "local", baseCity: "Holton", cities: ["Pentwater", "Ludington"] })).toBe(
      "Entrega somente em Holton e região: Pentwater, Ludington."
    );
  });
  it("loja local sem lista de cidades", () => {
    expect(deliveryNoticeText({ scope: "local", baseCity: "Holton", cities: [] })).toBe("Entrega somente em Holton e região.");
  });
  it("ignora espaços e itens vazios nas cidades", () => {
    expect(deliveryNoticeText({ scope: "local", baseCity: " Holton ", cities: [" Pentwater ", ""] })).toBe(
      "Entrega somente em Holton e região: Pentwater."
    );
  });
});
