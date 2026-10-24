"use server";

import { requireStoreFinanceAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { activateSponsorship } from "@/lib/sponsorship/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

/** Ativa ou pausa o destaque da loja. Ativar exige a mensalidade em dia. */
export async function setSponsorshipAction(active: boolean): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreFinanceAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  if (active) {
    const result = await activateSponsorship(store.id);
    if (!result.ok) return actionError(result.error);
    return actionSuccess(undefined);
  }
  const service = createSupabaseServiceClient();
  const { error } = await service.from("sponsorships").update({ status: "pausado" }).eq("store_id", store.id);
  if (error) return actionError("Não foi possível pausar agora. Tente de novo.");
  return actionSuccess(undefined);
}
