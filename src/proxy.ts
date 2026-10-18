import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_STORE_SLUG, isPlatformRootHost, parseStoreHost } from "@/lib/store/host";

/**
 * Camada 1 de autorização (a camada 2 é o RLS no banco — Etapa 2/9).
 * - Rotas /lojas/<loja>/... são reescritas para a rota da loja, informando a loja por cabeçalho.
 * - Qualquer cabeçalho x-store-slug enviado pelo cliente é removido: só o proxy define a loja.
 * - Renova o cookie de sessão do Supabase nas áreas protegidas.
 * - Bloqueia /conta/* sem sessão (redireciona para /login).
 * - Bloqueia /admin/* sem sessão de administrador (redireciona para a home).
 */

const STORE_HEADER = "x-store-slug";
const PROTECTED_PREFIXES = ["/conta", "/admin", "/plataforma"];

function sanitizedHeaders(request: NextRequest, slug?: string): Headers {
  const headers = new Headers(request.headers);
  headers.delete(STORE_HEADER);
  if (slug) headers.set(STORE_HEADER, slug);
  return headers;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /lojas/<loja>/...: reescreve para a rota da loja (áreas protegidas seguem o endereço direto).
  const lojaMatch = pathname.match(/^\/lojas\/([a-z0-9-]+)(\/.*)?$/);
  if (lojaMatch) {
    const slug = lojaMatch[1];
    const rest = lojaMatch[2] ?? "/";
    if (rest === "/conta" || rest.startsWith("/conta/") || rest === "/plataforma" || rest.startsWith("/plataforma/")) {
      return NextResponse.redirect(new URL(rest, request.url), 308);
    }
    // /admin dentro da loja: a permissão é conferida no layout do admin (login/home se não puder).
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.rewrite(url, { request: { headers: sanitizedHeaders(request, slug) } });
  }

  // Home no endereço da plataforma: mostra a página da plataforma.
  if (pathname === "/") {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
    if (isPlatformRootHost(host)) {
      return NextResponse.rewrite(new URL("/inicio-plataforma", request.url), { request: { headers: sanitizedHeaders(request) } });
    }
    return NextResponse.next({ request: { headers: sanitizedHeaders(request) } });
  }

  // Demais páginas públicas: só higieniza o cabeçalho de loja, sem custo de banco.
  if (!isProtectedPath(pathname)) {
    return NextResponse.next({ request: { headers: sanitizedHeaders(request) } });
  }

  const response = NextResponse.next({ request: { headers: sanitizedHeaders(request) } });

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

    // Administrador que abre "minha conta" vai direto para o painel.
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml)$).*)"],
};
