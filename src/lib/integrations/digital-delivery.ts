import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

const DOWNLOAD_LINK_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias

/**
 * Gera um link temporário de download para um produto digital, a partir
 * do caminho privado guardado em `digital_assets.storage_path`. Chamado
 * apenas pelo webhook (após pagamento aprovado) e pela área do cliente
 * ao carregar a lista de downloads — nunca lido publicamente da tabela
 * (Etapa 3/9: RLS de `digital_assets` restringe leitura a admin/service role).
 */
export async function generateDigitalDownloadLink(productId: string): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data: asset, error } = await supabase
    .from("digital_assets")
    .select("storage_path")
    .eq("product_id", productId)
    .maybeSingle();

  if (error || !asset) {
    logger.warn("Nenhum arquivo digital encontrado para o produto", { productId });
    return null;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("produtos-digitais")
    .createSignedUrl(asset.storage_path, DOWNLOAD_LINK_EXPIRY_SECONDS);

  if (signError || !signed) {
    logger.error("Erro ao gerar link assinado de download", { productId, error: signError?.message });
    return null;
  }

  return signed.signedUrl;
}
