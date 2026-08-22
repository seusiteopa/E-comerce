import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware global — resolve dois problemas:
 *
 * 1) Renovação de sessão do Supabase (auth): sem isso, o cookie de
 *    sessão expira e o usuário passa a ser tratado como deslogado em
 *    Server Components, mesmo tendo feito login pouco antes.
 *
 * 2) Proteção das rotas /admin no perímetro (antes de renderizar
 *    qualquer página): se não houver sessão válida, redireciona para
 *    /login em vez de deixar a página lançar UnauthorizedError sem
 *    tratamento (o que gerava a tela de erro genérica do Next.js).
 *    A verificação de *papel* (role === "administrador") continua
 *    sendo feita depois, dentro de cada página, via requireAdminProfile().
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Importante: isso já dispara a renovação do token quando necessário.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto arquivos estáticos e de imagem,
     * para não gastar tempo de execução renovando sessão em assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
