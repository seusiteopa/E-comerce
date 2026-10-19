"use server";

import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

/** Ids dos pedidos pagos pelo site (não de balcão) da loja, dos últimos 3 dias. */
export async function listPaidOrderIdsAction(): Promise<ActionResult<{ ids: string[] }>> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("store_id", store.id)
    .eq("status", "pago")
    .neq("channel", "balcao")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  return actionSuccess({ ids: (data ?? []).map((o) => o.id) });
}
