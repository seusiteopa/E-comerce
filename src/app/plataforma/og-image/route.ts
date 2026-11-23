import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { OG_SETTING_KEY, parseImageDataUrl } from "@/lib/plataforma/og";

/** Imagem de compartilhamento da página inicial da plataforma. Sem imagem própria, usa a padrão do site. */
export async function GET(request: Request) {
  const service = createSupabaseServiceClient();
  const { data } = await service.from("platform_settings").select("value").eq("key", OG_SETTING_KEY).maybeSingle();
  const parsed = data?.value ? parseImageDataUrl(data.value) : null;
  if (!parsed) return Response.redirect(new URL("/plataforma/assets/og-image.jpg", request.url), 302);
  return new Response(Buffer.from(parsed.bytes), {
    headers: { "content-type": parsed.type, "cache-control": "public, max-age=300" },
  });
}
