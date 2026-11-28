"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { fileInputSchema, MAX_REFERENCIAS } from "@/lib/briefing/arquivos";

const idSchema = z.string().uuid();

/**
 * Assinatura de upload para o cliente enviar as referências do pedido dele. A pasta é definida aqui
 * no servidor (uma por cliente), então ninguém consegue subir arquivo em outro lugar.
 */
export async function getReferenceUploadSignatureAction() {
  const profile = await requireAuthenticatedProfile();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const folder = `vecorion/briefings/${profile.id}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, timestamp, signature, folder };
}

async function ownBrief(briefId: string) {
  const profile = await requireAuthenticatedProfile();
  const service = createSupabaseServiceClient();
  const { data } = await service.from("service_briefs").select("id, user_id, references_text").eq("id", briefId).maybeSingle();
  if (!data || data.user_id !== profile.id) return null;
  return { service, brief: data };
}

/** Guarda os arquivos de referência que o cliente enviou para o pedido dele. */
export async function addReferenceFilesAction(briefId: string, files: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success) return actionError("Dados inválidos.");
  const parsed = z.array(fileInputSchema).min(1).max(MAX_REFERENCIAS).safeParse(files);
  if (!parsed.success) return actionError("Confira os arquivos enviados.");
  const own = await ownBrief(briefId);
  if (!own) return actionError("Pedido não encontrado.");

  const { count } = await own.service.from("brief_files").select("id", { count: "exact", head: true }).eq("brief_id", briefId).eq("kind", "referencia");
  if ((count ?? 0) + parsed.data.length > MAX_REFERENCIAS) return actionError(`Você pode enviar no máximo ${MAX_REFERENCIAS} arquivos de referência.`);

  const { error } = await own.service.from("brief_files").insert(
    parsed.data.map((f) => ({ brief_id: briefId, kind: "referencia", url: f.url, media_type: f.mediaType, name: f.name || null }))
  );
  if (error) return actionError("Não foi possível salvar os arquivos agora.");
  revalidatePath("/conta", "layout");
  return actionSuccess(undefined);
}

/** Acrescenta links ou observações às referências do pedido. */
export async function addReferenceTextAction(briefId: string, text: string): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success) return actionError("Dados inválidos.");
  const clean = text.trim();
  if (clean.length < 3 || clean.length > 1000) return actionError("Escreva entre 3 e 1000 caracteres.");
  const own = await ownBrief(briefId);
  if (!own) return actionError("Pedido não encontrado.");
  const joined = [own.brief.references_text, clean].filter(Boolean).join("\n");
  if (joined.length > 3000) return actionError("O espaço de referências deste pedido está cheio.");
  const { error } = await own.service.from("service_briefs").update({ references_text: joined }).eq("id", briefId);
  if (error) return actionError("Não foi possível salvar agora.");
  revalidatePath("/conta", "layout");
  return actionSuccess(undefined);
}
