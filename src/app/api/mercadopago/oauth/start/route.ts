import { NextResponse } from "next/server";
import { requireAuthenticatedProfile, UnauthorizedError } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { buildAuthorizationUrl } from "@/lib/integrations/mercadopago/oauth";
import { logger } from "@/lib/logger";

/**
 * O lojista clica em "Conectar Mercado Pago" no painel da loja (?loja=<slug>).
 * A loja vem do endereço, mas só é usada se quem clica for administrador dela.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("loja") ?? "";
  const storeBase = /^[a-z0-9-]+$/.test(slug) ? `/lojas/${slug}` : "";

  try {
    const profile = await requireAuthenticatedProfile();
    if (!storeBase) return NextResponse.redirect(new URL("/admin/pagamentos?erro=conexao", request.url));

    const service = createSupabaseServiceClient();
    const { data: store } = await service
      .from("stores")
      .select("id, slug, is_platform_owned")
      .eq("slug", slug)
      .maybeSingle();
    if (!store) return NextResponse.redirect(new URL("/admin/pagamentos?erro=conexao", request.url));

    const [{ data: member }, { data: platformAdmin }] = await Promise.all([
      service.from("store_members").select("role").eq("store_id", store.id).eq("user_id", profile.id).maybeSingle(),
      service.from("platform_admins").select("user_id").eq("user_id", profile.id).maybeSingle(),
    ]);
    if (!member && !platformAdmin) return NextResponse.redirect(new URL("/", request.url));

    if (store.is_platform_owned) {
      return NextResponse.redirect(new URL(`${storeBase}/admin/pagamentos`, request.url));
    }

    const authUrl = await buildAuthorizationUrl(store.id, profile.id);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const back = encodeURIComponent(`${storeBase}/admin/pagamentos`);
      return NextResponse.redirect(new URL(`/login?redirecionar=${back}`, request.url));
    }
    logger.error("Falha ao iniciar conexão com o Mercado Pago", {
      integration: "mercadopago",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(new URL(`${storeBase}/admin/pagamentos?erro=conexao`, request.url));
  }
}
