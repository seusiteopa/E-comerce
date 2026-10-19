import "server-only";
import { headers } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Endereço de quem faz a chamada (vem do provedor da hospedagem). */
async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-nf-client-connection-ip") || "desconhecido";
}

/**
 * Conta uma tentativa para o endereço. Devolve false quando passou do limite.
 * Ex.: rateLimit("login", 5, 15 * 60) = 5 tentativas a cada 15 minutos por endereço.
 */
export async function rateLimit(action: string, max: number, windowSeconds: number): Promise<boolean> {
  const address = await clientAddress();
  const service = createSupabaseServiceClient();
  const { data, error } = await service.rpc("rate_limit_hit", {
    p_bucket: `${action}:${address}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  // Se o controle falhar, não bloqueia a pessoa (melhor deixar passar do que travar a loja).
  if (error) return true;
  return data === true;
}

export const TOO_MANY_MESSAGE = "Muitas tentativas. Tente de novo em alguns minutos.";
