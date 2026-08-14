"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile, UnauthorizedError } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

export async function toggleFavoriteAction(productId: string): Promise<ActionResult<{ favorited: boolean }>> {
  try {
    const profile = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();

    const { data: existing } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("profile_id", profile.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("profile_id", profile.id).eq("product_id", productId);
      revalidatePath("/conta/favoritos");
      return actionSuccess({ favorited: false });
    }

    await supabase.from("favorites").insert({ profile_id: profile.id, product_id: productId });
    revalidatePath("/conta/favoritos");
    return actionSuccess({ favorited: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return actionError("Você precisa entrar na sua conta para favoritar produtos.");
    }
    logger.error("Erro ao alternar favorito", { error: String(error) });
    return actionError("Não foi possível atualizar seus favoritos agora.");
  }
}
