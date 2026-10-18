import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** Código de indicação da loja: cria na primeira vez e devolve o mesmo código depois. */
export async function ensureReferralCode(storeId: string): Promise<string> {
  const service = createSupabaseServiceClient();
  const { data: existing } = await service.from("referral_codes").select("code").eq("store_id", storeId).maybeSingle();
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { error } = await service.from("referral_codes").insert({ store_id: storeId, code });
    if (!error) return code;
  }
  throw new Error("Não foi possível gerar o código de indicação.");
}

/** Registra a indicação quando uma loja nova é criada com um código válido (sem alterar cobrança). */
export async function registerReferral(referredStoreId: string, code: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { data: ref } = await service.from("referral_codes").select("store_id").eq("code", code).maybeSingle();
  if (!ref?.store_id || ref.store_id === referredStoreId) return;
  await service.from("referrals").insert({
    referrer_store_id: ref.store_id,
    referred_store_id: referredStoreId,
    status: "pendente",
    discount_pct: 20,
  });
}

/** Quando a loja indicada autoriza a mensalidade: marca a indicação como aplicada e registra o desconto pendente. */
export async function markReferralApplied(referredStoreId: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { data: referral } = await service
    .from("referrals")
    .select("id, referrer_store_id, discount_pct, status")
    .eq("referred_store_id", referredStoreId)
    .maybeSingle();
  if (!referral || referral.status !== "pendente") return;

  await service.from("referrals").update({ status: "aplicada", applied_at: new Date().toISOString() }).eq("id", referral.id);
  await service
    .from("store_billing")
    .update({ referral_discount_pct: referral.discount_pct })
    .eq("store_id", referral.referrer_store_id);
}
