"use server";

import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";

async function assertAdmin(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}

/** Cadastra uma agência para um usuário já existente (pelo e-mail dele). Só a plataforma faz isso. */
export async function createPartnerAction(input: unknown): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const parsed = z.object({ name: z.string().trim().min(2).max(120), ownerEmail: z.string().trim().email() }).safeParse(input);
  if (!parsed.success) return actionError("Confira o nome e o e-mail da agência.");

  const service = createSupabaseServiceClient();
  const { data: list } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const owner = list?.users.find((u) => u.email?.toLowerCase() === parsed.data.ownerEmail.toLowerCase());
  if (!owner) return actionError("Não há usuário com esse e-mail. A pessoa precisa criar a conta primeiro.");

  const { error } = await service.from("partners").insert({ name: parsed.data.name, owner_user_id: owner.id, status: "ativo" });
  if (error) return actionError("Não foi possível cadastrar a agência (talvez ela já exista).");
  return actionSuccess(undefined);
}

/** Ativa ou suspende uma agência. Suspensa, ela perde o acesso imediatamente. */
export async function setPartnerStatusAction(partnerId: string, status: "ativo" | "suspenso"): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("partners").update({ status }).eq("id", partnerId);
  if (error) return actionError("Não foi possível alterar a agência.");
  return actionSuccess(undefined);
}

/** Vincula uma loja a uma agência (ou remove o vínculo, com partnerId null). */
export async function linkStoreToPartnerAction(storeId: string, partnerId: string | null): Promise<ActionResult> {
  if (!(await assertAdmin())) return actionError("Acesso restrito à plataforma.");
  const service = createSupabaseServiceClient();
  const { error } = await service.from("stores").update({ partner_id: partnerId }).eq("id", storeId);
  if (error) return actionError("Não foi possível vincular a loja.");
  return actionSuccess(undefined);
}
