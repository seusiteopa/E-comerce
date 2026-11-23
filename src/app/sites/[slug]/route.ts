import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE_SLUG_RE } from "@/lib/sites/entrega";

/** Publica o site entregue ao cliente, no endereço /sites/nome-do-site. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SITE_SLUG_RE.test(slug)) return new Response("Não encontrado", { status: 404 });
  const service = createSupabaseServiceClient();
  const { data } = await service.from("site_deliveries").select("html").eq("slug", slug).maybeSingle();
  if (!data) return new Response("Não encontrado", { status: 404 });
  return new Response(data.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
