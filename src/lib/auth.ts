import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileRow } from "@/types/database";

export class UnauthorizedError extends Error {
  constructor(message = "Sessão não encontrada. Faça login para continuar.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Retorna o perfil do usuário autenticado na sessão atual, ou lança
 * UnauthorizedError. Usado por toda Server Action que exige login
 * (Etapa 7, Seção 9 — autorização em duas camadas: aqui é a camada de
 * aplicação; o RLS das migrations é a segunda camada, no banco).
 */
export async function requireAuthenticatedProfile(): Promise<ProfileRow> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new UnauthorizedError("Perfil não encontrado para esta sessão.");
  }

  return profile as ProfileRow;
}

/** Mesma verificação de sessão, mas exige que o papel seja "administrador". */
export async function requireAdminProfile(): Promise<ProfileRow> {
  const profile = await requireAuthenticatedProfile();
  if (profile.role !== "administrador") {
    throw new ForbiddenError();
  }
  return profile;
}
