"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato 00:00.");
const dayRow = z.object({
  weekday: z.number().int().min(0).max(6),
  closed: z.boolean(),
  opens_at: hhmm.nullable(),
  closes_at: hhmm.nullable(),
});
const schema = z.object({ rows: z.array(dayRow).length(7) });

/** Salva o horário de funcionamento da loja. Todos os dias da semana são enviados. */
export async function saveStoreHoursAction(input: unknown): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Confira os horários informados.");

  for (const r of parsed.data.rows) {
    if (!r.closed && (!r.opens_at || !r.closes_at)) {
      return actionError("Informe abertura e fechamento nos dias abertos.");
    }
  }

  const service = createSupabaseServiceClient();
  await service.from("store_hours").delete().eq("store_id", store.id);
  const toInsert = parsed.data.rows.map((r) => ({
    store_id: store.id,
    weekday: r.weekday,
    closed: r.closed,
    opens_at: r.closed ? null : r.opens_at,
    closes_at: r.closed ? null : r.closes_at,
  }));
  const { error } = await service.from("store_hours").insert(toInsert);
  if (error) return actionError("Não foi possível salvar o horário agora. Tente de novo.");
  return actionSuccess(undefined);
}
