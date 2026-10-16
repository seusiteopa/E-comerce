"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStoreAdmin } from "@/lib/auth";
import { startSubscriptionForStore } from "@/lib/billing/subscribe";
import { storeOrigin } from "@/lib/store/urls";
import { logger } from "@/lib/logger";

/** Botão "Autorizar mensalidade" do painel: leva o lojista ao Mercado Pago para autorizar as cobranças mensais. */
export async function startSubscriptionAction(): Promise<void> {
  const { store } = await requireStoreAdmin();
  if (store.is_platform_owned) redirect("/admin/pagamentos");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/admin/pagamentos?erro=assinatura");

  let url: string;
  try {
    const origin = await storeOrigin(store);
    const result = await startSubscriptionForStore({
      storeId: store.id,
      storeName: store.name,
      payerEmail: user.email,
      returnUrl: `${origin}/admin/pagamentos?assinatura=1`,
    });
    url = result.authorizationUrl;
  } catch (error) {
    logger.error("Falha ao iniciar assinatura pelo painel", {
      storeId: store.id,
      error: error instanceof Error ? error.message : String(error),
    });
    redirect("/admin/pagamentos?erro=assinatura");
  }
  redirect(url);
}
