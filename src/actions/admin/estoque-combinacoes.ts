"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { attrsKey, type Attrs } from "@/lib/produto/combinacoes";

const schema = z.object({
  productId: z.string().uuid(),
  rows: z
    .array(z.object({ attributes: z.record(z.string().max(60), z.string().max(60)), stock: z.number().int().min(0).max(999999) }))
    .max(500),
});

/** Salva o estoque de cada combinação. Combinações antigas ficam com estoque zero (o histórico de pedidos é preservado). */
export async function saveCombinationStockAction(input: unknown): Promise<ActionResult> {
  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel da loja.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Confira o estoque informado.");

  const service = createSupabaseServiceClient();
  const { data: product } = await service.from("products").select("id, slug").eq("id", parsed.data.productId).eq("store_id", store.id).maybeSingle();
  if (!product) return actionError("Produto não encontrado nesta loja.");

  const { data: existing } = await service.from("product_variations").select("id, attributes, stock").eq("product_id", product.id);
  const byKey = new Map((existing ?? []).map((v) => [attrsKey(v.attributes as Attrs), v]));
  const wanted = new Set<string>();

  for (const row of parsed.data.rows) {
    const key = attrsKey(row.attributes);
    wanted.add(key);
    const current = byKey.get(key);
    if (current) {
      const { error } = await service.from("product_variations").update({ stock: row.stock }).eq("id", current.id);
      if (error) return actionError("Não foi possível salvar o estoque agora.");
    } else {
      const sku = `${product.slug}-${crypto.randomUUID().slice(0, 8)}`;
      const { error } = await service.from("product_variations").insert({ product_id: product.id, sku, stock: row.stock, attributes: row.attributes });
      if (error) return actionError("Não foi possível salvar o estoque agora.");
    }
  }

  // Combinações que não existem mais na lista: zera o estoque, sem apagar o registro.
  for (const v of existing ?? []) {
    if (!wanted.has(attrsKey(v.attributes as Attrs))) {
      await service.from("product_variations").update({ stock: 0 }).eq("id", v.id);
    }
  }
  return actionSuccess(undefined);
}
