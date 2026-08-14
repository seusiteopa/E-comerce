import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso no servidor (Server Components, Server Actions,
 * Route Handlers) — lê/escreve a sessão via cookies seguros geridos pelo
 * Next.js, nunca via localStorage (decisão de segurança da Etapa 2).
 * Continua usando apenas a chave pública: as regras de acesso são impostas
 * pelo RLS, respeitando a identidade do usuário autenticado na sessão.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll pode ser chamado a partir de um Server Component (não
            // pode gravar cookie ali) — seguro ignorar quando o middleware
            // já cuida de renovar a sessão (ver src/middleware.ts).
          }
        },
      },
    }
  );
}
