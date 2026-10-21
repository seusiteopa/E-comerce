/** Dias de tolerância depois do vencimento antes de bloquear a loja. */
export const GRACE_DAYS = 3;

/** Soma meses a uma data no formato AAAA-MM-DD (sem depender do fuso do servidor). */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day)).toISOString().slice(0, 10);
}

/** Dias entre duas datas AAAA-MM-DD (positivo se `to` é depois de `from`). */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** A loja está bloqueada quando alguma cobrança aberta passou do vencimento + tolerância. */
export function isBlockedByOverdue(
  invoices: { status: string; due_date: string }[],
  today: string
): boolean {
  return invoices.some((inv) => inv.status === "aberta" && daysBetween(inv.due_date, today) > GRACE_DAYS);
}

/** Valor da mensalidade com desconto de indicação (em centavos), sem passar de 0 nem do valor cheio. */
export function discountedAmountCents(feeCents: number, discountPct: number): number {
  const pct = Math.min(Math.max(Math.round(discountPct), 0), 100);
  const value = Math.round((feeCents * (100 - pct)) / 100);
  return Math.min(Math.max(value, 0), feeCents);
}
