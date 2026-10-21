import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Retorno do login com Google: troca o código pela sessão e volta para onde a pessoa estava. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/conta/pedidos";
  // Só aceita caminhos internos (evita redirecionar para outro site).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/conta/pedidos";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }
  return NextResponse.redirect(new URL("/login?erro=google", request.url));
}
