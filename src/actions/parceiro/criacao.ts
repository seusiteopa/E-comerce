"use server";

import { z } from "zod";
import { getActivePartner } from "@/lib/partners/access";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { setupFeeCents } from "@/lib/implantacao/pricing";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const schema = z.object({ storeId: z.string().uuid(), productCount: z.coerce.number().int().min(0).max(100000) });

/** A agência abre a criação assistida só para as lojas vinculadas a ela. */
export async function openSetupAsPartnerAction(input: unknown): Promise<ActionResult> {
  const partner = await getActivePartner();
  if (!partner) return actionError("Acesso restrito a agências ativas.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Confira a loja e a quantidade de produtos.");

  const service = createSupabaseServiceClient();
  const { data: store } = await service.from("stores").select("id, partner_id").eq("id", parsed.data.storeId).maybeSingle();
  if (!store || store.partner_id !== partner.id) return actionError("Esta loja não está vinculada à sua agência.");

  const fee = setupFeeCents(parsed.data.productCount);
  if (fee === null) return actionError("Acima de 150 produtos o valor é sob consulta. Fale com a Vecorion.");

  const { data: open } = await service.from("billing_invoices").select("id").eq("store_id", store.id).eq("kind", "implantacao").eq("status", "aberta").maybeSingle();
  if (open) return actionError("Esta loja já tem uma criação assistida em aberto.");

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  const { error } = await service.from("billing_invoices").insert({
    store_id: store.id, kind: "implantacao", period_start: today, due_date: due, amount_cents: fee,
  });
  if (error) return actionError("Não foi possível abrir a cobrança agora.");
  return actionSuccess(undefined);
}
