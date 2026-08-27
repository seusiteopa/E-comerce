import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDigitalUploadTargetAction } from "@/actions/digital-upload";

/**
 * Sobe o arquivo digital (ebook, PDF, ZIP...) DIRETO do navegador pro
 * bucket privado do Supabase Storage. Retorna o caminho salvo (storage
 * path), que é o que fica registrado em `digital_assets`.
 */
export async function uploadDigitalFileToStorage(file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "bin";
  const { path, token } = await getDigitalUploadTargetAction(extension);

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("produtos-digitais")
    .uploadToSignedUrl(path, token, file);

  if (error) {
    throw new Error(`Falha ao enviar o arquivo digital: ${error.message}`);
  }

  return path;
}
