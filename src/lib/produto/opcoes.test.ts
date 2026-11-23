import { describe, expect, it } from "vitest";
import { normalizeGroup, validateGroups, type GroupInput } from "./opcoes";

const base: GroupInput = { name: "Tamanho", mode: "escolha", required: true, min_choices: 1, max_choices: null, options: [{ name: "P", extra_price: 0 }] };

describe("validateGroups", () => {
  it("aceita um grupo correto", () => {
    expect(validateGroups([base])).toBeNull();
  });
  it("exige nome e opções", () => {
    expect(validateGroups([{ ...base, name: " " }])).toMatch(/nome/);
    expect(validateGroups([{ ...base, options: [] }])).toMatch(/pelo menos uma opção/);
  });
  it("rejeita valor extra negativo", () => {
    expect(validateGroups([{ ...base, options: [{ name: "G", extra_price: -1 }] }])).toMatch(/Valor extra/);
  });
  it("máximo menor que mínimo é erro", () => {
    expect(validateGroups([{ ...base, mode: "multipla", min_choices: 2, max_choices: 1 }])).toMatch(/máximo/);
  });
  it("escolha única não aceita máximo maior que 1", () => {
    expect(validateGroups([{ ...base, max_choices: 3 }])).toMatch(/máximo é 1/);
  });
  it("obrigatório exige mínimo de 1", () => {
    expect(validateGroups([{ ...base, required: true, min_choices: 0 }])).toMatch(/mínimo é 1/);
  });
});

describe("normalizeGroup", () => {
  it("escolha única fica com máximo 1", () => {
    expect(normalizeGroup(base).max_choices).toBe(1);
  });
  it("múltipla obrigatória fica com mínimo 1", () => {
    expect(normalizeGroup({ ...base, mode: "multipla", min_choices: 0 }).min_choices).toBe(1);
  });
});

import { checkSelection, type SelectableGroup } from "./opcoes";

const groups: SelectableGroup[] = [
  { id: "g1", name: "Tamanho", required: true, min_choices: 1, max_choices: 1, options: [{ id: "p", name: "P", extra_price: 0 }, { id: "g", name: "G", extra_price: 5 }] },
  { id: "g2", name: "Adicionais", required: false, min_choices: 0, max_choices: 2, options: [{ id: "bacon", name: "Bacon", extra_price: 4 }, { id: "ovo", name: "Ovo", extra_price: 2 }, { id: "queijo", name: "Queijo", extra_price: 3 }] },
];

describe("checkSelection", () => {
  it("soma os extras e devolve os nomes escolhidos", () => {
    expect(checkSelection(groups, ["g", "bacon"])).toEqual({ extra: 9, labels: ["G", "Bacon"] });
  });
  it("obrigatório sem escolha dá erro", () => {
    expect(checkSelection(groups, ["bacon"])).toEqual({ error: 'Escolha ao menos 1 opção em "Tamanho".' });
  });
  it("passar do máximo dá erro", () => {
    expect(checkSelection(groups, ["p", "bacon", "ovo", "queijo"])).toEqual({ error: 'Em "Adicionais", o máximo é 2.' });
  });
  it("opção que não existe dá erro", () => {
    expect("error" in checkSelection(groups, ["p", "xyz"])).toBe(true);
  });
});
