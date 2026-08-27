"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminProfile } from "@/lib/auth";

/**
 * Gera uma URL assinada de upload direto pro bucket privado
 * "produtos-digitais" — o arquivo (ebook, PDF, ZIP...) vai direto do
 * navegador pro Supabase Storage, sem passar pela Function do servidor
 * (mesmo motivo do upload direto pro Cloudinary: evita o teto de tamanho
 * de requisição do Netlify).
 */
export async function getDigitalUploadTargetAction(extension: string) {
  await requireAdminProfile();

  const supabase = createSupabaseServiceClient();
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const path = `pendentes/${crypto.randomUUID()}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from("produtos-digitais")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível preparar o upload do arquivo digital.");
  }

  return { path: data.path, token: data.token };
}
