import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileRow } from "@/types/database";
import { getCurrentStore, type CurrentStore } from "@/lib/store/current";

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

/**
 * Exige sessão E que a pessoa seja membro da loja aberta agora (dono,
 * gerente ou equipe) ou dono da plataforma. A loja vem do endereço da
 * requisição (ver lib/store/current.ts), nunca de um campo do navegador.
 * O RLS do banco é a segunda camada: repete essa mesma regra por loja.
 */
export async function requireStoreAdmin(): Promise<{ profile: ProfileRow; store: CurrentStore }> {
  const profile = await requireAuthenticatedProfile();
  const store = await getCurrentStore();
  const supabase = await createSupabaseServerClient();

  const [{ data: member }, { data: platformAdmin }] = await Promise.all([
    supabase.from("store_members").select("role").eq("store_id", store.id).eq("user_id", profile.id).maybeSingle(),
    supabase.from("platform_admins").select("user_id").eq("user_id", profile.id).maybeSingle(),
  ]);

  if (!member && !platformAdmin) {
    throw new ForbiddenError();
  }
  return { profile, store };
}

/** Compatível com o código existente: agora significa "administra ESTA loja". */
export async function requireAdminProfile(): Promise<ProfileRow> {
  const { profile } = await requireStoreAdmin();
  return profile;
}
