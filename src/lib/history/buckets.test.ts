import { describe, expect, it } from "vitest";
import { buildHistory, weekStart } from "./buckets";

describe("weekStart", () => {
  it("retorna a segunda-feira da semana", () => {
    expect(weekStart("2026-10-23")).toBe("2026-10-19"); // sexta → segunda anterior
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // segunda
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // domingo
  });
});

describe("buildHistory", () => {
  const metrics = [
    { day: "2026-10-01", ordersPaid: 2, revenueCents: 10000 },
    { day: "2026-10-02", ordersPaid: 1, revenueCents: 5000 },
    { day: "2026-11-01", ordersPaid: 3, revenueCents: 30000 },
    { day: "2025-12-31", ordersPaid: 1, revenueCents: 2000 },
  ];

  it("agrupa por mês, do mais recente para o mais antigo", () => {
    const { months } = buildHistory(metrics);
    expect(months.map((m) => m.label)).toEqual(["2026-11", "2026-10", "2025-12"]);
    expect(months[1]).toMatchObject({ ordersPaid: 3, revenueCents: 15000, averageTicketCents: 5000 });
  });

  it("agrupa por ano", () => {
    const { years } = buildHistory(metrics);
    expect(years.map((y) => [y.label, y.ordersPaid])).toEqual([["2026", 6], ["2025", 1]]);
  });

  it("agrupa por semana", () => {
    const { weeks } = buildHistory(metrics);
    expect(weeks[0].start).toBe("2026-10-26"); // 1º de novembro/2026 é domingo
  });

  it("ticket médio é zero quando não houve pedido", () => {
    const { months } = buildHistory([{ day: "2026-01-05", ordersPaid: 0, revenueCents: 0 }]);
    expect(months[0].averageTicketCents).toBe(0);
  });

  it("sem dados, não cria nenhum período", () => {
    expect(buildHistory([])).toEqual({ weeks: [], months: [], years: [] });
  });
});
