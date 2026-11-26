"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

/** Marca ou desmarca um produto como destaque da página inicial da loja. */
export async function setProductFeaturedAction(productId: string, featured: boolean): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data, error } = await supabase
    .from("products")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("store_id", storeId)
    .select("id");
  if (error || !data || data.length === 0) return actionError("Não foi possível atualizar o destaque deste produto.");
  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}
