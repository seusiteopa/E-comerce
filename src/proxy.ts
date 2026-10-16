import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_STORE_SLUG, parseStoreHost } from "@/lib/store/host";

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
  const isPlatformRoute = pathname.startsWith("/plataforma");

  // /plataforma: exige sessão aqui; a checagem de "dono da plataforma" é feita na própria página.
  if (isPlatformRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((isAccountRoute || isAdminRoute) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((isAccountRoute || isAdminRoute) && user) {
    // Quem administra: membro da loja deste endereço, ou dono da plataforma.
    const { slug, domain } = parseStoreHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "");
    let storeId: string | null = null;
    if (slug) {
      storeId = (await supabase.from("stores").select("id").eq("slug", slug).maybeSingle()).data?.id ?? null;
    }
    if (!storeId && domain) {
      storeId = (await supabase.from("stores").select("id").eq("custom_domain", domain).maybeSingle()).data?.id ?? null;
    }
    if (!storeId) {
      storeId = (await supabase.from("stores").select("id").eq("slug", DEFAULT_STORE_SLUG).maybeSingle()).data?.id ?? null;
    }

    const [{ data: member }, { data: platformAdmin }] = await Promise.all([
      storeId
        ? supabase.from("store_members").select("role").eq("store_id", storeId).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    const isAdmin = Boolean(member || platformAdmin);

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Quem é administrador e navega para qualquer link de "minha conta"
    // (ex: ícone no cabeçalho, sempre apontando para /conta/pedidos) é
    // levado direto para o painel — só existe uma conta cadastrada como
    // admin, então não faz sentido ela ver a área de cliente comum.
    if (isAccountRoute && isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*", "/plataforma/:path*"],
};
