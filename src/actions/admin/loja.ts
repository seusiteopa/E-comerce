"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveHomeOrder } from "@/lib/store/home-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStoreAdmin } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { disconnectStore } from "@/lib/integrations/mercadopago/oauth";
import { logger } from "@/lib/logger";

const storeProfileSchema = z.object({
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

function httpsOrEmpty(value: string): string | null {
  if (!value) return null;
  return value.startsWith("https://") ? value : null;
}

/** Dados da loja: nome, contato, imagem de compartilhamento (OG), logo e app de impressão. */
export async function updateStoreProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = storeProfileSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("stores")
    .update({
      name: d.name,
      description: d.description || null,
      whatsapp: d.whatsapp.replace(/\D/g, "") || null,
      og_title: d.og_title || null,
      og_description: d.og_description || null,
      og_image_url: httpsOrEmpty(d.og_image_url),
      logo_url: httpsOrEmpty(d.logo_url),
      printer_app: d.printer_app,
      updated_at: new Date().toISOString(),
    })
    .eq("id", store.id);

  if (error) {
    logger.error("Erro ao salvar dados da loja", { storeId: store.id, error: error.message });
    return actionError("Não foi possível salvar agora. Tente novamente.");
  }

  const settingsRows = [
    { store_id: store.id, key: "site_description", value: d.footer_text },
    { store_id: store.id, key: "contact_email", value: d.contact_email },
    { store_id: store.id, key: "instagram_url", value: d.instagram_url },
  ];
  const { error: settingsError } = await supabase.from("site_settings").upsert(settingsRows, { onConflict: "store_id,key" });
  if (settingsError) {
    logger.error("Erro ao salvar rodapé da loja", { storeId: store.id, error: settingsError.message });
    return actionError("Não foi possível salvar o rodapé agora. Tente novamente.");
  }

  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}

export async function disconnectMercadoPagoAction(): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  if (store.is_platform_owned) return actionError("A loja da plataforma usa a conta principal.");
  await disconnectStore(store.id);
  revalidatePath("/admin/pagamentos");
  return actionSuccess(undefined);
}

export async function updateStorePagesAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      page_sobre: z.string().max(4000).optional().default(""),
      page_faq: z.string().max(4000).optional().default(""),
      page_contato: z.string().max(4000).optional().default(""),
      page_politica_privacidade: z.string().max(4000).optional().default(""),
      page_politica_termos: z.string().max(4000).optional().default(""),
      page_politica_trocas: z.string().max(4000).optional().default(""),
    })
    .safeParse(input);
  if (!parsed.success) return actionError("Texto muito longo em alguma página (máximo de 4000 caracteres).");

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const rows = Object.entries(parsed.data).map(([key, value]) => ({ store_id: store.id, key, value }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "store_id,key" });
  if (error) {
    logger.error("Erro ao salvar páginas da loja", { storeId: store.id, error: error.message });
    return actionError("Não foi possível salvar as páginas agora. Tente novamente.");
  }

  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}

export async function updateHomeOrderAction(order: unknown): Promise<ActionResult> {
  if (!Array.isArray(order) || order.some((x) => typeof x !== "string")) return actionError("Ordem inválida.");
  const resolved = resolveHomeOrder(order.join(","));

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ store_id: store.id, key: "home_order", value: resolved.join(",") }, { onConflict: "store_id,key" });
  if (error) {
    logger.error("Erro ao salvar ordem da página inicial", { storeId: store.id, error: error.message });
    return actionError("Não foi possível salvar a ordem agora. Tente novamente.");
  }

  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}
