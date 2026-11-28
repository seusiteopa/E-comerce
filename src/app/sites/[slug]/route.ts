import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE_SLUG_RE } from "@/lib/sites/entrega";

/** Publica o site entregue ao cliente, no endereço /sites/nome-do-site. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SITE_SLUG_RE.test(slug)) return new Response("Não encontrado", { status: 404 });
  const service = createSupabaseServiceClient();
  let html: string | null = null;
  const { data } = await service.from("site_deliveries").select("html").eq("slug", slug).maybeSingle();
  html = data?.html ?? null;
  if (!html) {
    // Sites de pedidos de serviço só ficam no ar depois que a plataforma libera a entrega.
    const { data: brief } = await service
      .from("service_briefs")
      .select("delivery_html")
      .eq("site_slug", slug)
      .not("released_at", "is", null)
      .maybeSingle();
    html = brief?.delivery_html ?? null;
  }
  if (!html) return new Response("Não encontrado", { status: 404 });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
