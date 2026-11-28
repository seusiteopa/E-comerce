"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { validateSiteDelivery } from "@/lib/sites/entrega";
import { fileInputSchema, MAX_ENTREGA_MIDIAS } from "@/lib/briefing/arquivos";

const idSchema = z.string().uuid();

async function assertOwner(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}

function refresh(id: string) {
  revalidatePath(`/plataforma/briefings/${id}`);
  revalidatePath("/conta", "layout");
}

/** Salva o arquivo do site (HTML) e o endereço dele. O cliente só vê depois da liberação. */
export async function saveBriefSiteAction(briefId: string, slugInput: string, html: string): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success) return actionError("Dados inválidos.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const slug = slugInput.trim().toLowerCase();
  const invalid = validateSiteDelivery(slug, html);
  if (invalid) return actionError(invalid);

  const service = createSupabaseServiceClient();
  const { data: brief } = await service.from("service_briefs").select("id, kind").eq("id", briefId).maybeSingle();
  if (!brief) return actionError("Pedido não encontrado.");
  if (brief.kind !== "site") return actionError("Só pedidos de site recebem arquivo de site.");

  const { data: otherSite } = await service.from("site_deliveries").select("slug").eq("slug", slug).maybeSingle();
  const { data: otherBrief } = await service.from("service_briefs").select("id").eq("site_slug", slug).neq("id", briefId).maybeSingle();
  if (otherSite || otherBrief) return actionError("Este endereço já está em uso por outro site.");

  const { error } = await service.from("service_briefs").update({ site_slug: slug, delivery_html: html }).eq("id", briefId);
  if (error) return actionError("Não foi possível salvar o site agora.");
  refresh(briefId);
  return actionSuccess(undefined);
}

/** Guarda as mídias da entrega (até 3 por pedido). */
export async function addDeliveryMediaAction(briefId: string, files: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success) return actionError("Dados inválidos.");
  const parsed = z.array(fileInputSchema).min(1).max(MAX_ENTREGA_MIDIAS).safeParse(files);
  if (!parsed.success) return actionError("Confira os arquivos enviados.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const service = createSupabaseServiceClient();
  const { count } = await service.from("brief_files").select("id", { count: "exact", head: true }).eq("brief_id", briefId).eq("kind", "entrega");
  if ((count ?? 0) + parsed.data.length > MAX_ENTREGA_MIDIAS) return actionError(`Cada pedido recebe no máximo ${MAX_ENTREGA_MIDIAS} mídias de entrega.`);
  const { error } = await service.from("brief_files").insert(
    parsed.data.map((f) => ({ brief_id: briefId, kind: "entrega", url: f.url, media_type: f.mediaType, name: f.name || null }))
  );
  if (error) return actionError("Não foi possível salvar as mídias agora.");
  refresh(briefId);
  return actionSuccess(undefined);
}

export async function removeBriefFileAction(briefId: string, fileId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success || !idSchema.safeParse(fileId).success) return actionError("Dados inválidos.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("brief_files").delete().eq("id", fileId).eq("brief_id", briefId);
  if (error) return actionError("Não foi possível remover agora.");
  refresh(briefId);
  return actionSuccess(undefined);
}

/** Libera (ou recolhe) a entrega para o cliente ver e compartilhar. */
export async function setBriefReleasedAction(briefId: string, released: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(briefId).success) return actionError("Dados inválidos.");
  if (!(await assertOwner())) return actionError("Acesso restrito ao dono da plataforma.");
  const service = createSupabaseServiceClient();
  const { data: brief } = await service.from("service_briefs").select("id, kind, site_slug").eq("id", briefId).maybeSingle();
  if (!brief) return actionError("Pedido não encontrado.");
  if (released && brief.kind === "site" && !brief.site_slug) return actionError("Envie o arquivo do site antes de liberar.");
  const patch = released ? { released_at: new Date().toISOString(), status: "concluido" } : { released_at: null };
  const { error } = await service.from("service_briefs").update(patch).eq("id", briefId);
  if (error) return actionError("Não foi possível atualizar agora.");
  refresh(briefId);
  return actionSuccess(undefined);
}
