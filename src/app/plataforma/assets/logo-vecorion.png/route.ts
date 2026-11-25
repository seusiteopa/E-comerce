import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { LOGO_SETTING_KEY, parseImageDataUrl } from "@/lib/plataforma/og";

/**
 * Logo da plataforma enviada pelo painel. Se um arquivo com este nome for colocado em
 * public/plataforma/assets/, o arquivo tem prioridade e esta rota não é usada.
 */
export async function GET() {
  const service = createSupabaseServiceClient();
  const { data } = await service.from("platform_settings").select("value").eq("key", LOGO_SETTING_KEY).maybeSingle();
  const parsed = data?.value ? parseImageDataUrl(data.value) : null;
  if (!parsed) return new Response("Logo ainda não enviada", { status: 404 });
  return new Response(Buffer.from(parsed.bytes), {
    headers: { "content-type": parsed.type, "cache-control": "public, max-age=300" },
  });
}
