import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Camada 1 de autorização (a camada 2 é o RLS no banco — Etapa 2/9).
 * - Renova o cookie de sessão do Supabase a cada requisição.
 * - Bloqueia acesso a /conta/* sem sessão válida (redireciona para /login).
 * - Bloqueia acesso a /admin/* sem sessão de administrador (redireciona
 *   para a home da loja — não revela nem a existência da rota admin
 *   para quem não tem permissão).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isAccountRoute = pathname.startsWith("/conta");
  const isAdminRoute = pathname.startsWith("/admin");

  if ((isAccountRoute || isAdminRoute) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "administrador") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*"],
};
