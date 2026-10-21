import "server-only";
import webpush from "web-push";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

/** Envia notificação para todos os aparelhos da loja. Nunca bloqueia a venda: erros só são registrados. */
export async function sendStorePush(storeId: string, payload: { title: string; body: string; url: string }): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    logger.warn("Notificação não enviada: chaves VAPID não configuradas", { storeId });
    return;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:loja@vecorion.com.br", publicKey, privateKey);

  const service = createSupabaseServiceClient();
  const { data: subs } = await service.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("store_id", storeId);
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      // Aparelho que revogou a permissão ou expirou: remove para não tentar de novo.
      if (status === 404 || status === 410) await service.from("push_subscriptions").delete().eq("id", sub.id);
      else logger.warn("Falha ao enviar notificação", { storeId, status });
    }
  }
}
