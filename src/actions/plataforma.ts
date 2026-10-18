"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const idSchema = z.string().uuid();

/**
 * Pausar/liberar loja — SEMPRE decisão manual do dono da plataforma. Atraso de mensalidade nunca
 * pausa sozinho: a loja segue vendendo, o sistema só avisa.
 */
export async function setStoreStatusAction(storeId: string, status: "ativa" | "pausada"): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success || (status !== "ativa" && status !== "pausada")) return actionError("Dados inválidos.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }

  const service = createSupabaseServiceClient();
  const { data: store } = await service.from("stores").select("is_platform_owned").eq("id", storeId).maybeSingle();
  if (!store) return actionError("Loja não encontrada.");
  if (store.is_platform_owned && status === "pausada") return actionError("A loja da própria plataforma não pode ser pausada.");

  const { error } = await service.from("stores").update({ status, updated_at: new Date().toISOString() }).eq("id", storeId);
  if (error) {
    logger.error("Erro ao alterar status da loja", { storeId, error: error.message });
    return actionError("Não foi possível alterar agora.");
  }
  revalidatePath("/plataforma");
  return actionSuccess(undefined);
}

/** Marca manualmente a situação da mensalidade (ex.: lojista pagou por fora). */
export async function setBillingStatusAction(storeId: string, billingStatus: "em_dia" | "atrasada"): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success || (billingStatus !== "em_dia" && billingStatus !== "atrasada")) return actionError("Dados inválidos.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("store_billing")
    .update({ billing_status: billingStatus, updated_at: new Date().toISOString() })
    .eq("store_id", storeId);
  if (error) return actionError("Não foi possível alterar agora.");
  revalidatePath("/plataforma");
  return actionSuccess(undefined);
}

const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  description: z.string().trim().max(300).optional().default(""),
  whatsapp: z.string().trim().max(20).optional().default(""),
  og_title: z.string().trim().max(90).optional().default(""),
  og_description: z.string().trim().max(200).optional().default(""),
  og_image_url: z.string().trim().max(500).optional().default(""),
  logo_url: z.string().trim().max(500).optional().default(""),
  printer_app: z.enum(["thermer", "rawbt"]),
  footer_text: z.string().trim().max(300).optional().default(""),
  contact_email: z.string().trim().max(120).optional().default(""),
  instagram_url: z.string().trim().max(200).optional().default(""),
});

/** Dono da plataforma edita os dados de qualquer loja (mesmos campos que o lojista edita). */
export async function updateStoreProfileForStoreAction(storeId: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success) return actionError("Loja inválida.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }

  const parsed = profileFieldsSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("stores")
    .update({
      name: d.name,
      description: d.description || null,
      whatsapp: d.whatsapp.replace(/\D/g, "") || null,
      og_title: d.og_title || null,
      og_description: d.og_description || null,
      og_image_url: d.og_image_url || null,
      logo_url: d.logo_url || null,
      printer_app: d.printer_app,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);
  if (error) {
    logger.error("Erro ao salvar loja pela plataforma", { storeId, error: error.message });
    return actionError("Não foi possível salvar agora. Tente novamente.");
  }

  const { error: settingsError } = await service.from("site_settings").upsert(
    [
      { store_id: storeId, key: "site_description", value: d.footer_text },
      { store_id: storeId, key: "contact_email", value: d.contact_email },
      { store_id: storeId, key: "instagram_url", value: d.instagram_url },
    ],
    { onConflict: "store_id,key" }
  );
  if (settingsError) {
    logger.error("Erro ao salvar rodapé pela plataforma", { storeId, error: settingsError.message });
    return actionError("Não foi possível salvar o rodapé agora. Tente novamente.");
  }

  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}

const platformSettingsSchema = z.object({
  monthly_fee_reais: z
    .union([z.number(), z.string()])
    .transform((v) => Number(String(v).replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n >= 0 && n <= 10000, "Mensalidade inválida."),
  custom_domain: z.string().trim().toLowerCase().max(120).optional().default(""),
});

/** Configurações que só o dono da plataforma controla: mensalidade e domínio próprio. */
export async function updateStorePlatformSettingsAction(storeId: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(storeId).success) return actionError("Loja inválida.");
  try {
    await requirePlatformAdmin();
  } catch {
    return actionError("Acesso restrito ao dono da plataforma.");
  }

  const parsed = platformSettingsSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;
  if (d.custom_domain && !/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d.custom_domain)) {
    return actionError("Domínio inválido. Exemplo: minhaloja.com.br");
  }

  const service = createSupabaseServiceClient();
  const { error: billingError } = await service
    .from("store_billing")
    .update({ monthly_fee_cents: Math.round(d.monthly_fee_reais * 100) })
    .eq("store_id", storeId);
  if (billingError) {
    logger.error("Erro ao salvar mensalidade", { storeId, error: billingError.message });
    return actionError("Não foi possível salvar a mensalidade agora.");
  }

  const { error: storeError } = await service
    .from("stores")
    .update({ custom_domain: d.custom_domain || null, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (storeError) {
    logger.error("Erro ao salvar domínio", { storeId, error: storeError.message });
    return actionError("Não foi possível salvar o domínio. Ele pode já estar em uso por outra loja.");
  }

  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}
