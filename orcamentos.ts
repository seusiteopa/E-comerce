"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

async function guardAdmin() {
  try {
    return await requireAdminProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) throw error;
    throw new ForbiddenError();
  }
}

const schema = z.object({
  quoteRequestId: z.string().uuid(),
  status: z.enum(["novo", "em_contato", "respondido", "encerrado"]),
});

export async function updateQuoteRequestStatusAction(input: unknown): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("quote_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.quoteRequestId);

  if (error) {
    logger.error("Erro ao atualizar status de orçamento", { error: error.message });
    return actionError("Não foi possível atualizar o status.");
  }

  revalidatePath("/admin/orcamentos");
  return actionSuccess(undefined);
}
