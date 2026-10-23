export type DailyMetric = { day: string; ordersPaid: number; revenueCents: number };
export type Bucket = { label: string; start: string; ordersPaid: number; revenueCents: number; averageTicketCents: number };

/** Início da semana (segunda-feira) de uma data AAAA-MM-DD. */
export function weekStart(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

function groupBy(metrics: DailyMetric[], keyOf: (day: string) => string, labelOf: (key: string) => string): Bucket[] {
  const map = new Map<string, { ordersPaid: number; revenueCents: number }>();
  for (const m of metrics) {
    const key = keyOf(m.day);
    const acc = map.get(key) ?? { ordersPaid: 0, revenueCents: 0 };
    acc.ordersPaid += m.ordersPaid;
    acc.revenueCents += m.revenueCents;
    map.set(key, acc);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, acc]) => ({
      label: labelOf(key),
      start: key,
      ordersPaid: acc.ordersPaid,
      revenueCents: acc.revenueCents,
      averageTicketCents: acc.ordersPaid > 0 ? Math.round(acc.revenueCents / acc.ordersPaid) : 0,
    }));
}

/** Agrupa os dias por semana, mês e ano. Mais recentes primeiro. */
export function buildHistory(metrics: DailyMetric[]): { weeks: Bucket[]; months: Bucket[]; years: Bucket[] } {
  return {
    weeks: groupBy(metrics, weekStart, (k) => `Semana de ${k}`),
    months: groupBy(metrics, (d) => d.slice(0, 7), (k) => k),
    years: groupBy(metrics, (d) => d.slice(0, 4), (k) => k),
  };
}
