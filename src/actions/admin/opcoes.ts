"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { normalizeGroup, validateGroups, type GroupInput } from "@/lib/produto/opcoes";

const groupSchema = z.object({
  name: z.string().trim().max(60),
  mode: z.enum(["escolha", "multipla"]),
  required: z.boolean(),
  min_choices: z.number().int().min(0).max(50),
  max_choices: z.number().int().min(0).max(50).nullable(),
  options: z.array(z.object({ name: z.string().trim().max(60), extra_price: z.number().min(0).max(9999) })).max(50),
});
const schema = z.object({ productId: z.string().uuid(), groups: z.array(groupSchema).max(20) });

/** Salva os grupos e opções de um produto da loja (substitui os anteriores). */
export async function saveProductOptionsAction(input: unknown): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Confira as opções informadas.");

  const groups: GroupInput[] = parsed.data.groups.map((g) => normalizeGroup(g as GroupInput));
  const error = validateGroups(groups);
  if (error) return actionError(error);

  const service = createSupabaseServiceClient();
  const { data: product } = await service.from("products").select("id").eq("id", parsed.data.productId).eq("store_id", store.id).maybeSingle();
  if (!product) return actionError("Produto não encontrado nesta loja.");

  await service.from("product_option_groups").delete().eq("product_id", product.id);

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const { data: row, error: gErr } = await service
      .from("product_option_groups")
      .insert({
        product_id: product.id,
        store_id: store.id,
        name: g.name,
        mode: g.mode,
        required: g.required,
        min_choices: g.min_choices,
        max_choices: g.max_choices,
        position: gi,
      })
      .select("id")
      .single();
    if (gErr || !row) return actionError("Não foi possível salvar as opções agora.");

    const { error: oErr } = await service.from("product_options").insert(
      g.options.map((o, oi) => ({
        group_id: row.id,
        product_id: product.id,
        store_id: store.id,
        name: o.name,
        extra_price: o.extra_price,
        position: oi,
      }))
    );
    if (oErr) return actionError("Não foi possível salvar as opções agora.");
  }
  return actionSuccess(undefined);
}
