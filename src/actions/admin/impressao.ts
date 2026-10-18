"use server";

import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/store/current";
import { signToken } from "@/lib/crypto";
import { buildTicketLines, toPlainText } from "@/lib/print/ticket";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

/** Gera o link que abre o app de impressão escolhido pelo lojista (Thermer ou RawBT) já com o cupom. */
export async function getPrintLinkAction(orderId: string): Promise<ActionResult<{ url: string }>> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: storeRow } = await supabase.from("stores").select("printer_app").eq("id", store.id).maybeSingle();
  const lines = await buildTicketLines(orderId, store.id, supabase);
  if (!lines) return actionError("Pedido não encontrado.");

  if (storeRow?.printer_app === "rawbt") {
    const base64 = Buffer.from(toPlainText(lines), "utf8").toString("base64");
    return actionSuccess({ url: `rawbt:base64,${base64}` });
  }

  const origin = await getRequestOrigin();
  const token = signToken(`print:${store.id}:${orderId}`, 10 * 60);
  return actionSuccess({ url: `my.bluetoothprint.scheme://${origin}/api/impressao/${orderId}?t=${token}` });
}
