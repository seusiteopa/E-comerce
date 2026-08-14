import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de serviço (service role), que IGNORA o RLS.
 *
 * REGRA NÃO NEGOCIÁVEL (Etapa 2, Seção 5 / Etapa 9): este cliente só pode
 * ser importado por código que roda exclusivamente no servidor e que
 * precisa, de forma justificada, contornar o RLS — por exemplo:
 *  - o webhook do Mercado Pago confirmando pagamento (Etapa 4/10);
 *  - geração de link assinado de download de produto digital;
 *  - rotinas administrativas que operam sobre dados de múltiplos clientes.
 *
 * O import de "server-only" faz o build falhar caso este arquivo seja
 * acidentalmente importado por um Client Component — proteção em tempo de
 * build, não apenas convenção documental.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Falha explícita e imediata é preferível a um cliente criado com
    // chave "undefined" — evita erros confusos de autenticação mais tarde,
    // encontrado durante a QA da Etapa 11.
    throw new Error(
      "Configuração ausente: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não definidos."
    );
  }

  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
