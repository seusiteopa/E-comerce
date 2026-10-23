"use server";

import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { setupFeeCents } from "@/lib/implantacao/pricing";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const schema = z.object({
  storeId: z.string().uuid(),
  productCount: z.coerce.number().int().min(0).max(100000),
});

/** A Vecorion abre a cobrança única de criação assistida para uma loja, conforme a quantidade de produtos. */
export async function openSetupInvoiceAction(input: unknown): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito à plataforma.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Confira a loja e a quantidade de produtos.");

  const fee = setupFeeCents(parsed.data.productCount);
  if (fee === null) return actionError("Acima de 150 produtos o valor é sob consulta. Monte a cobrança manualmente.");

  const service = createSupabaseServiceClient();
  const { data: open } = await service
    .from("billing_invoices")
    .select("id")
    .eq("store_id", parsed.data.storeId)
    .eq("kind", "implantacao")
    .eq("status", "aberta")
    .maybeSingle();
  if (open) return actionError("Esta loja já tem uma implantação em aberto.");

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  const { error } = await service.from("billing_invoices").insert({
    store_id: parsed.data.storeId,
    kind: "implantacao",
    period_start: today,
    due_date: due,
    amount_cents: fee,
  });
  if (error) return actionError("Não foi possível abrir a cobrança agora.");
  return actionSuccess(undefined);
}
