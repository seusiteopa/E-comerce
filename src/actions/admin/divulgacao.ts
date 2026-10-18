"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const briefSchema = z.object({
  title: z.string().trim().min(2, "Dê um título para a divulgação.").max(120),
  productId: z.string().uuid().optional().or(z.literal("")),
  audience: z.string().trim().max(300).optional().default(""),
  tone: z.string().trim().max(120).optional().default(""),
  format: z.enum(["post", "story", "anuncio"]),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function createBriefAction(input: unknown): Promise<ActionResult> {
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_briefs").insert({
    store_id: store.id,
    product_id: d.productId || null,
    title: d.title,
    audience: d.audience,
    tone: d.tone,
    format: d.format,
    notes: d.notes,
  });
  if (error) {
    logger.error("Erro ao criar briefing de divulgação", { storeId: store.id, error: error.message });
    return actionError("Não foi possível salvar o briefing agora.");
  }
  revalidatePath("/admin/divulgacao");
  return actionSuccess(undefined);
}

/** Gera uma campanha de texto a partir do briefing (modelo simples; imagens entram na próxima etapa). */
export async function createCampaignAction(briefId: unknown): Promise<ActionResult> {
  if (typeof briefId !== "string" || !z.string().uuid().safeParse(briefId).success) {
    return actionError("Briefing inválido.");
  }

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: brief } = await supabase
    .from("marketing_briefs")
    .select("id, title, audience, tone, format, notes, product_id")
    .eq("id", briefId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (!brief) return actionError("Briefing não encontrado.");

  let productName = "";
  if (brief.product_id) {
    const { data: product } = await supabase.from("products").select("name, slug").eq("id", brief.product_id).maybeSingle();
    productName = product?.name ?? "";
  }

  const linhas = [
    productName ? `Destaque: ${productName}.` : "",
    brief.title + ".",
    brief.audience ? `Para: ${brief.audience}.` : "",
    brief.tone ? `Tom: ${brief.tone}.` : "",
    brief.notes ? brief.notes : "",
    `Chame no WhatsApp e confira na loja ${store.name}.`,
  ].filter(Boolean);
  const content = linhas.join("\n");

  const { error } = await supabase.from("marketing_campaigns").insert({
    store_id: store.id,
    brief_id: brief.id,
    kind: "texto",
    content,
    status: "gerada",
  });
  if (error) {
    logger.error("Erro ao gerar campanha", { storeId: store.id, error: error.message });
    return actionError("Não foi possível gerar a campanha agora.");
  }
  revalidatePath("/admin/divulgacao");
  return actionSuccess(undefined);
}

export async function deleteBriefAction(briefId: unknown): Promise<ActionResult> {
  if (typeof briefId !== "string" || !z.string().uuid().safeParse(briefId).success) {
    return actionError("Briefing inválido.");
  }
  try {
    await requireStoreAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_briefs").delete().eq("id", briefId);
  if (error) return actionError("Não foi possível excluir o briefing.");
  revalidatePath("/admin/divulgacao");
  return actionSuccess(undefined);
}
