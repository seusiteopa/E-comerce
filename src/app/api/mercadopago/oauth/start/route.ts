import { NextResponse } from "next/server";
import { requireStoreAdmin, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { buildAuthorizationUrl } from "@/lib/integrations/mercadopago/oauth";
import { logger } from "@/lib/logger";

/** O lojista clica em "Conectar Mercado Pago" no painel → segue para a tela de autorização do Mercado Pago. */
export async function GET(request: Request) {
  try {
    const { profile, store } = await requireStoreAdmin();
    if (store.is_platform_owned) {
      return NextResponse.redirect(new URL("/admin/pagamentos", request.url));
    }
    const url = await buildAuthorizationUrl(store.id, profile.id);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    logger.error("Falha ao iniciar conexão com o Mercado Pago", {
      integration: "mercadopago",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(new URL("/admin/pagamentos?erro=conexao", request.url));
  }
}
