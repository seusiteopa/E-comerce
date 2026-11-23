/** Horário de funcionamento. Sem linhas cadastradas = loja aberta sempre (padrão). */
export type HourRow = { weekday: number; closed: boolean; opens_at: string | null; closes_at: string | null };

export type OpenStatus =
  | { open: true }
  | { open: false; opensAt: string | null };

const TIME_RE = /^(\d{2}):(\d{2})/;

function toMinutes(hhmm: string): number | null {
  const m = TIME_RE.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutos desde 00:00 no fuso de São Paulo, e o dia da semana (0 = domingo). */
export function saoPauloClock(now: Date): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = days.indexOf(get("weekday"));
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { weekday: weekday < 0 ? 0 : weekday, minutes };
}

/** Diz se a loja está aberta agora. Se fechada, informa o próximo horário de abertura do dia. */
export function storeOpenStatus(rows: HourRow[] | null | undefined, now: Date = new Date()): OpenStatus {
  if (!rows || rows.length === 0) return { open: true };
  const { weekday, minutes } = saoPauloClock(now);
  const today = rows.find((r) => r.weekday === weekday);
  if (!today || today.closed || !today.opens_at || !today.closes_at) {
    return { open: false, opensAt: null };
  }
  const opens = toMinutes(today.opens_at);
  const closes = toMinutes(today.closes_at);
  if (opens === null || closes === null) return { open: true };
  // Horário que atravessa a meia-noite (ex.: 18:00 às 02:00).
  const crossesMidnight = closes <= opens;
  const inside = crossesMidnight ? minutes >= opens || minutes < closes : minutes >= opens && minutes < closes;
  if (inside) return { open: true };
  return { open: false, opensAt: today.opens_at.slice(0, 5) };
}
