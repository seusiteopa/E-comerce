"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { signUpSchema, loginSchema } from "@/lib/validation/schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

/**
 * Cadastro e login só são exigidos no momento do checkout (decisão da
 * Etapa 1) — estas actions são chamadas a partir do IdentificationStep
 * do checkout ou das páginas /login e /cadastro.
 */
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError("Verifique os campos destacados.", flattenZodErrors(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) {
    logger.warn("Falha no cadastro de cliente", { reason: error.message });
    return actionError("Não foi possível criar sua conta. Verifique os dados e tente novamente.");
  }

  return actionSuccess(undefined);
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ isAdmin: boolean }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError("Verifique os campos destacados.", flattenZodErrors(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return actionError("E-mail ou senha incorretos.");
  }

  // Login único para todo mundo — quem é administrador vai direto pro
  // painel /admin ao entrar; clientes comuns vão pra área normal da conta.
  // Evita precisar de dois "apps" instalados para o mesmo domínio.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return actionSuccess({ isAdmin: profile?.role === "administrador" });
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Exclusão de conta a pedido do titular (LGPD) — não conformidade
 * identificada na auditoria da Etapa 13 (Etapa 2 já previa este
 * requisito, nunca implementado). Remove o usuário da autenticação
 * (auth.users) via cliente de serviço — o registro em `profiles` e
 * dados dependentes (addresses, favorites) são removidos em cascata
 * pelas foreign keys `on delete cascade` definidas na migration 001/003.
 *
 * Pedidos já realizados (`orders`) NÃO são excluídos — mantidos por
 * obrigação contábil/fiscal, mesmo sem CNPJ/nota fiscal ativa nesta
 * fase; a referência a `profile_id` fica órfã (coluna sem cascade em
 * `orders`), preservando o histórico comercial.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Sessão não encontrada.");
  }

  const serviceClient = createSupabaseServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    logger.error("Erro ao excluir conta", { userId: user.id, error: error.message });
    return actionError("Não foi possível excluir sua conta agora. Tente novamente ou fale com o suporte.");
  }

  await supabase.auth.signOut();
  logger.info("Conta excluída a pedido do titular (LGPD)", { userId: user.id });
  redirect("/");
}

function flattenZodErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const key in flat) {
    const messages = flat[key];
    if (messages && messages[0]) result[key] = messages[0];
  }
  return result;
}
