import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

const DOWNLOAD_LINK_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias (apenas para o provedor legado "supabase")

/**
 * Gera o link de download de um produto digital. Chamado apenas pelo
 * webhook (após pagamento aprovado) e pela área do cliente ao carregar a
 * lista de downloads — nunca lido publicamente da tabela (RLS de
 * `digital_assets` restringe leitura a admin/service role).
 *
 * Dois provedores possíveis (ver migration 014):
 *  - "cloudinary" (atual): storage_path já guarda a URL final e
 *    definitiva do arquivo (identificador aleatório, imprevisível — não
 *    listado em lugar nenhum do site antes da entrega). Não expira
 *    sozinha, mas nunca é exposta antes do pagamento confirmado.
 *  - "supabase" (legado): produtos cadastrados antes da migração para o
 *    Cloudinary — link assinado com expiração de 7 dias, como antes.
 */
export async function generateDigitalDownloadLink(productId: string): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data: asset, error } = await supabase
    .from("digital_assets")
    .select("storage_path, provider")
    .eq("product_id", productId)
    .maybeSingle();

  if (error || !asset) {
    logger.warn("Nenhum arquivo digital encontrado para o produto", { productId });
    return null;
  }

  if (asset.provider === "cloudinary") {
    return asset.storage_path;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("produtos-digitais")
    .createSignedUrl(asset.storage_path, DOWNLOAD_LINK_EXPIRY_SECONDS);

  if (signError || !signed) {
    logger.error("Erro ao gerar link assinado de download (Supabase)", { productId, error: signError?.message });
    return null;
  }

  return signed.signedUrl;
}
