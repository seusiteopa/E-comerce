"use server";

import { z } from "zod";
import { getActivePartner } from "@/lib/partners/access";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

const RESERVED = new Set([
  "www", "app", "api", "admin", "painel", "plataforma", "vecorion", "login", "cadastro", "conta", "suporte",
  "ajuda", "loja", "lojas", "mail", "email", "ftp", "static", "assets", "cdn", "blog", "docs", "status", "teste", "test",
]);

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  slug: z.string().trim().toLowerCase().min(3, "O endereço precisa de pelo menos 3 letras.").max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen."),
  storeType: z.enum(["loja", "restaurante", "digital", "misto"]),
  whatsapp: z.string().trim().max(20).optional().default(""),
  clientEmail: z.string().trim().email("Informe o e-mail do cliente, que será o responsável pelo pagamento."),
});

/**
 * A agência cria a loja de um cliente. A loja nasce vinculada à agência, com papel "agencia":
 * ela gerencia a loja, mas não tem acesso a pagamentos nem a cobranças.
 */
export async function createClientStoreAction(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const partner = await getActivePartner();
  if (!partner) return actionError("Acesso restrito a agências ativas.");

  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Confira os dados da loja.");
  const d = parsed.data;
  if (RESERVED.has(d.slug)) return actionError("Este endereço não está disponível. Escolha outro.");

  const service = createSupabaseServiceClient();
  const { data: store, error: storeError } = await service
    .from("stores")
    .insert({
      slug: d.slug,
      name: d.name,
      store_type: d.storeType,
      whatsapp: d.whatsapp.replace(/\D/g, "") || null,
      og_title: d.name,
      owner_id: partner.owner_user_id,
      partner_id: partner.id,
      is_platform_owned: false,
      status: "ativa",
    })
    .select("id, slug")
    .single();
  if (storeError || !store) {
    if (storeError?.code === "23505") return actionError("Este endereço já está em uso. Escolha outro.");
    logger.error("Erro ao criar loja da agência", { partnerId: partner.id, error: storeError?.message });
    return actionError("Não foi possível criar a loja agora. Tente novamente.");
  }

  const results = await Promise.all([
    service.from("store_members").insert({ store_id: store.id, user_id: partner.owner_user_id, role: "agencia" }),
    service.from("store_billing").insert({
      store_id: store.id,
      plan: "comissao",
      commission_bps: 0,
      payer_email: d.clientEmail,
    }),
    service.from("store_payment_connections").insert({ store_id: store.id, status: "desconectado" }),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    logger.error("Erro ao preparar loja da agência — desfazendo", { storeId: store.id, error: failed.error.message });
    await service.from("stores").delete().eq("id", store.id);
    return actionError("Não foi possível criar a loja agora. Tente novamente.");
  }
  return actionSuccess({ slug: store.slug });
}
