"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(5).max(100) }),
});

/** Registra o aparelho que aceitou notificações da loja atual. */
export async function subscribePushAction(input: unknown): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return actionError("Não foi possível ativar as notificações neste aparelho.");
  let profile, store;
  try {
    ({ profile, store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      store_id: store.id,
      profile_id: profile.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return actionError("Não foi possível salvar as notificações agora.");
  return actionSuccess(undefined);
}

export async function unsubscribePushAction(endpoint: unknown): Promise<ActionResult> {
  if (typeof endpoint !== "string") return actionError("Aparelho inválido.");
  const supabase = await createSupabaseServerClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return actionSuccess(undefined);
}
