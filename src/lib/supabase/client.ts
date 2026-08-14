import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o navegador. Usa apenas a chave pública (anon key) —
 * toda a proteção de dado vem do RLS definido nas migrations (Etapa 9),
 * nunca de lógica escondida no cliente (Etapa 2, Seção 5).
 *
 * Requer as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
