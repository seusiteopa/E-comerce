import { getCloudinarySignatureAction } from "@/actions/cloudinary";

/**
 * Sobe um arquivo DIRETO do navegador pro Cloudinary — só a assinatura
 * vem do servidor (ver getCloudinarySignatureAction). O arquivo em si
 * nunca passa pela Function do Netlify, então não existe limite de
 * tamanho de requisição do servidor aqui, só o do próprio Cloudinary.
 */
export async function uploadFileToCloudinary(
  file: File,
  resourceType: "image" | "video",
  folder: string
): Promise<string> {
  const { cloudName, apiKey, timestamp, signature, folder: signedFolder } = await getCloudinarySignatureAction(folder);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", signedFolder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha no upload para o Cloudinary: ${errorBody}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
