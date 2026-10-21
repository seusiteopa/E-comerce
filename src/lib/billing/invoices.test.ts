import { describe, expect, it } from "vitest";
import { addMonths, daysBetween, isBlockedByOverdue } from "./invoices";

describe("addMonths", () => {
  it("soma meses normalmente", () => {
    expect(addMonths("2026-10-17", 1)).toBe("2026-11-17");
  });
  it("vira o ano", () => {
    expect(addMonths("2026-12-05", 1)).toBe("2027-01-05");
  });
  it("ajusta o dia para o último dia do mês quando não existe", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("daysBetween", () => {
  it("conta dias positivos e negativos", () => {
    expect(daysBetween("2026-11-01", "2026-11-04")).toBe(3);
    expect(daysBetween("2026-11-04", "2026-11-01")).toBe(-3);
  });
});

describe("isBlockedByOverdue", () => {
  const due = "2026-11-10";
  it("não bloqueia no dia do vencimento nem nos 3 dias de tolerância", () => {
    expect(isBlockedByOverdue([{ status: "aberta", due_date: due }], "2026-11-10")).toBe(false);
    expect(isBlockedByOverdue([{ status: "aberta", due_date: due }], "2026-11-13")).toBe(false);
  });
  it("bloqueia depois de passar da tolerância", () => {
    expect(isBlockedByOverdue([{ status: "aberta", due_date: due }], "2026-11-14")).toBe(true);
  });
  it("cobrança paga ou cancelada não bloqueia", () => {
    expect(isBlockedByOverdue([{ status: "paga", due_date: due }], "2026-12-01")).toBe(false);
    expect(isBlockedByOverdue([{ status: "cancelada", due_date: due }], "2026-12-01")).toBe(false);
  });
  it("sem cobranças abertas, não bloqueia", () => {
    expect(isBlockedByOverdue([], "2026-12-01")).toBe(false);
  });
});
