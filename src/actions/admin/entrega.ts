"use server";

import { z } from "zod";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const deliverySchema = z.object({
  scope: z.enum(["local", "brasil"]),
  baseCity: z.string().trim().max(80).optional().default(""),
  cities: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

/** Salva se a loja entrega só na região ou para todo o Brasil, com a cidade-base e as cidades atendidas. */
export async function updateDeliveryAction(input: unknown): Promise<ActionResult> {
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) return actionError("Confira os dados de entrega.");
  if (parsed.data.scope === "local" && !parsed.data.baseCity) return actionError("Informe a cidade-base da loja.");

  let store;
  try {
    ({ store } = await requireStoreAdmin());
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("stores")
    .update({
      delivery_scope: parsed.data.scope,
      delivery_base_city: parsed.data.scope === "local" ? parsed.data.baseCity : null,
      delivery_cities: parsed.data.scope === "local" ? parsed.data.cities : [],
    })
    .eq("id", store.id);
  if (error) return actionError("Não foi possível salvar agora. Tente de novo.");
  return actionSuccess(undefined);
}
