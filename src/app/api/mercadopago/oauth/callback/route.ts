import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthState, completeConnection } from "@/lib/integrations/mercadopago/oauth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeOrigin, platformOrigin } from "@/lib/store/urls";
import { logger } from "@/lib/logger";

/**
 * Endereço de retorno cadastrado no aplicativo do Mercado Pago (um só, no domínio central).
 * A segurança vem do "state": uso único, expira em 10 minutos e está ligado a UMA loja e UM usuário.
 * Depois de conectar, o lojista volta para o painel da loja dele.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!state) return NextResponse.redirect(`${platformOrigin()}/`);

  const consumed = await consumeOAuthState(state);
  if (!consumed) return NextResponse.redirect(`${platformOrigin()}/`);

  const supabase = createSupabaseServiceClient();
  const { data: store } = await supabase.from("stores").select("slug, custom_domain").eq("id", consumed.storeId).maybeSingle();
  const origin = store ? await storeOrigin(store) : platformOrigin();
  // Sem domínio próprio, a loja mora em /lojas/<slug>: o retorno precisa manter esse prefixo.
  const base = store && origin === platformOrigin() ? `/lojas/${store.slug}` : "";

  if (!code) {
    // o lojista cancelou ou o Mercado Pago devolveu erro
    return NextResponse.redirect(`${origin}${base}/admin/pagamentos?erro=cancelado`);
  }

  try {
    await completeConnection(consumed.storeId, code);
    return NextResponse.redirect(`${origin}${base}/admin/pagamentos?conectado=1`);
  } catch (error) {
    logger.error("Falha ao concluir conexão com o Mercado Pago", {
      integration: "mercadopago",
      storeId: consumed.storeId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(`${origin}${base}/admin/pagamentos?erro=conexao`);
  }
}
