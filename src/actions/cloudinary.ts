"use server";

import { createHash } from "crypto";
import { requireAdminProfile } from "@/lib/auth";

/**
 * Gera só a ASSINATURA de upload — o arquivo em si nunca passa pelo
 * servidor (pela Function do Netlify), só a foto/vídeo vai direto do
 * navegador pro Cloudinary. Isso evita o teto de tamanho de requisição
 * da Function (bem menor que o necessário para vídeo, por exemplo).
 * Reservado a administradores para não virar upload público de graça.
 */
export async function getCloudinarySignatureAction(folder: string) {
  await requireAdminProfile();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
    .join("&");
  const signature = createHash("sha1").update(sorted + apiSecret).digest("hex");

  return { cloudName, apiKey, timestamp, signature, folder };
}
