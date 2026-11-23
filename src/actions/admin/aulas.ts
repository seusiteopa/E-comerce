"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { toEmbedUrl } from "@/lib/curso/video";

const schema = z.object({
  productId: z.string().uuid(),
  lessons: z.array(z.object({ title: z.string().trim().min(1, "Toda aula precisa de título.").max(120), videoUrl: z.string().trim().max(500) })).max(200),
});

/** Salva a lista de aulas do curso (substitui a anterior). Só aceita link do YouTube ou do Vimeo. */
export async function saveCourseLessonsAction(input: unknown): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Confira as aulas informadas.");

  const service = createSupabaseServiceClient();
  const { data: product } = await service.from("products").select("id, type").eq("id", parsed.data.productId).eq("store_id", store.id).maybeSingle();
  if (!product) return actionError("Curso não encontrado nesta loja.");
  if (store.store_type !== "curso") return actionError("Aulas só podem ser cadastradas em loja de cursos.");

  const lessons: { title: string; embed: string }[] = [];
  for (const [i, l] of parsed.data.lessons.entries()) {
    const embed = toEmbedUrl(l.videoUrl);
    if (!embed) return actionError(`A aula ${i + 1} precisa de um link do YouTube ou do Vimeo (https://).`);
    lessons.push({ title: l.title, embed });
  }

  await service.from("course_lessons").delete().eq("product_id", product.id);
  if (lessons.length > 0) {
    const { error } = await service.from("course_lessons").insert(
      lessons.map((l, position) => ({ product_id: product.id, store_id: store.id, title: l.title, video_url: l.embed, position }))
    );
    if (error) return actionError("Não foi possível salvar as aulas agora.");
  }
  return actionSuccess(undefined);
}
