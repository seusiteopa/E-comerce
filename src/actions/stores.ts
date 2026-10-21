"use server";

import { z } from "zod";
import { isValidCpf } from "@/lib/validation/cpf";
import { registerReferral } from "@/lib/store/referral";
import { requireAuthenticatedProfile, UnauthorizedError } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { startSubscriptionForStore } from "@/lib/billing/subscribe";
import { monthlyFeeFromEnv } from "@/lib/integrations/mercadopago/subscription";
import { storeOrigin } from "@/lib/store/urls";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "painel", "plataforma", "vecorion", "login", "cadastro", "conta", "suporte",
  "ajuda", "loja", "lojas", "mail", "email", "ftp", "static", "assets", "cdn", "blog", "docs", "status", "teste", "test",
]);

const createStoreSchema = z.object({
  cpf: z.string().optional().default(""),
  referralCode: z.string().trim().toLowerCase().max(20).optional().default(""),
  name: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "O endereço precisa de pelo menos 3 letras.")
    .max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen."),
  storeType: z.enum(["loja", "restaurante", "digital", "misto"]),
  whatsapp: z.string().trim().max(20).optional().default(""),
  plan: z.enum(["mensalidade"]),
});

export interface CreateStoreResult {
  storeUrl: string;
  /** Quando o plano é mensalidade: endereço no Mercado Pago para autorizar as cobranças (1º mês grátis). */
  authorizationUrl: string | null;
  subscriptionFailed: boolean;
}

/** Cadastro de loja nova: cria a loja, o dono, o plano e (se for mensalidade) a assinatura recorrente. */
export async function createStoreAction(input: unknown): Promise<ActionResult<CreateStoreResult>> {
  const parsed = createStoreSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Confira os dados da loja.");
  const d = parsed.data;

  if (RESERVED_SLUGS.has(d.slug)) return actionError("Este endereço não está disponível. Escolha outro.");

  let profile;
  try {
    profile = await requireAuthenticatedProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError) return actionError("Entre na sua conta para criar a loja.");
    throw error;
  }
  // Quem cria loja (conta de lojista) precisa de CPF válido, salvo uma vez na conta.
  const supabaseForCpf = await createSupabaseServerClient();
  const { data: cpfRow } = await supabaseForCpf.from("profiles").select("document").eq("id", profile.id).maybeSingle();
  if (!cpfRow?.document) {
    if (!isValidCpf(d.cpf)) return actionError("Informe um CPF válido para criar a loja.");
    const { error: cpfError } = await supabaseForCpf
      .from("profiles")
      .update({ document: d.cpf.replace(/\D/g, "") })
      .eq("id", profile.id);
    if (cpfError) return actionError("Não foi possível salvar o CPF agora. Tente de novo.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return actionError("Sua conta precisa ter um e-mail para criar a loja.");

  if (d.plan === "mensalidade" && !monthlyFeeFromEnv()) {
    return actionError("O plano de mensalidade ainda não está disponível. Escolha a comissão por venda.");
  }

  const service = createSupabaseServiceClient();

  // limite simples contra abuso: até 3 lojas por pessoa
  const { count } = await service.from("stores").select("id", { count: "exact", head: true }).eq("owner_id", profile.id);
  if ((count ?? 0) >= 3) return actionError("Você já atingiu o limite de lojas por conta.");

  const { data: store, error: storeError } = await service
    .from("stores")
    .insert({
      slug: d.slug,
      name: d.name,
      store_type: d.storeType,
      whatsapp: d.whatsapp.replace(/\D/g, "") || null,
      og_title: d.name,
      owner_id: profile.id,
      is_platform_owned: false,
      status: "ativa",
    })
    .select("id, slug, name, custom_domain")
    .single();

  if (storeError || !store) {
    if (storeError?.code === "23505") return actionError("Este endereço já está em uso. Escolha outro.");
    logger.error("Erro ao criar loja", { userId: profile.id, error: storeError?.message });
    return actionError("Não foi possível criar a loja agora. Tente novamente.");
  }

  const fee = monthlyFeeFromEnv();
  const results = await Promise.all([
    service.from("store_members").insert({ store_id: store.id, user_id: profile.id, role: "dono" }),
    service.from("store_billing").insert({
      store_id: store.id,
      plan: d.plan,
      commission_bps: 0,
      monthly_fee_cents: d.plan === "mensalidade" && fee ? Math.round(fee * 100) : null,
      payer_email: user.email,
    }),
    service.from("store_payment_connections").insert({ store_id: store.id, status: "desconectado" }),
  ]);

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    logger.error("Erro ao preparar loja nova — desfazendo", { storeId: store.id, error: failed.error.message });
    await service.from("stores").delete().eq("id", store.id); // cascata remove o que foi criado
    return actionError("Não foi possível criar a loja agora. Tente novamente.");
  }

  const origin = await storeOrigin(store);
  let authorizationUrl: string | null = null;
  let subscriptionFailed = false;

  if (d.plan === "mensalidade") {
    try {
      const result = await startSubscriptionForStore({
        storeId: store.id,
        storeName: store.name,
        payerEmail: user.email,
        returnUrl: `${origin}/admin/pagamentos?assinatura=1`,
      });
      authorizationUrl = result.authorizationUrl;
    } catch (error) {
      // A loja já existe; o lojista autoriza depois em "Pagamentos e plano".
      subscriptionFailed = true;
      logger.error("Loja criada, mas a assinatura falhou", {
        storeId: store.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info("Loja criada", { storeId: store.id, slug: store.slug, plan: d.plan });
  if (parsed.data.referralCode) await registerReferral(store.id, parsed.data.referralCode).catch(() => undefined);
  return actionSuccess({ storeUrl: `${origin}/admin/pagamentos`, authorizationUrl, subscriptionFailed });
}
