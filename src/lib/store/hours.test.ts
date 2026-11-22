import { describe, expect, it } from "vitest";
import { storeOpenStatus, saoPauloClock, type HourRow } from "./hours";

// 2026-11-18 é uma quarta-feira (weekday 3). Horário de Brasília = UTC-3.
const at = (hhmm: string) => new Date(`2026-11-18T${hhmm}:00-03:00`);

const wed = (opens: string, closes: string): HourRow[] => [
  { weekday: 3, closed: false, opens_at: opens, closes_at: closes },
];

describe("saoPauloClock", () => {
  it("usa o horário de Brasília e o dia da semana", () => {
    expect(saoPauloClock(at("18:30"))).toEqual({ weekday: 3, minutes: 18 * 60 + 30 });
  });
});

describe("storeOpenStatus", () => {
  it("sem horário cadastrado, a loja fica aberta", () => {
    expect(storeOpenStatus(null, at("03:00"))).toEqual({ open: true });
    expect(storeOpenStatus([], at("03:00"))).toEqual({ open: true });
  });

  it("dentro do horário está aberta", () => {
    expect(storeOpenStatus(wed("18:00", "23:00"), at("19:00"))).toEqual({ open: true });
  });

  it("antes da abertura está fechada e informa o horário", () => {
    expect(storeOpenStatus(wed("18:00", "23:00"), at("17:30"))).toEqual({ open: false, opensAt: "18:00" });
  });

  it("depois do fechamento está fechada", () => {
    expect(storeOpenStatus(wed("18:00", "23:00"), at("23:00"))).toEqual({ open: false, opensAt: "18:00" });
  });

  it("dia marcado como fechado", () => {
    const rows: HourRow[] = [{ weekday: 3, closed: true, opens_at: null, closes_at: null }];
    expect(storeOpenStatus(rows, at("19:00"))).toEqual({ open: false, opensAt: null });
  });

  it("dia sem linha cadastrada, quando a loja tem horário, fica fechado", () => {
    const rows: HourRow[] = [{ weekday: 1, closed: false, opens_at: "09:00", closes_at: "18:00" }];
    expect(storeOpenStatus(rows, at("10:00"))).toEqual({ open: false, opensAt: null });
  });

  it("horário que atravessa a meia-noite", () => {
    expect(storeOpenStatus(wed("18:00", "02:00"), at("01:00"))).toEqual({ open: true });
    expect(storeOpenStatus(wed("18:00", "02:00"), at("03:00"))).toEqual({ open: false, opensAt: "18:00" });
  });
});
