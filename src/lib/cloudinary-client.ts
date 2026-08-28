import { getCloudinarySignatureAction } from "@/actions/cloudinary";

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

/**
 * Sobe o arquivo digital (ebook, PDF, ZIP...) direto do navegador pro
 * Cloudinary, como recurso "raw" com um identificador ALEATÓRIO E
 * IMPOSSÍVEL DE ADIVINHAR (não segue nenhum padrão previsível, como o
 * nome do produto). O arquivo tecnicamente tem uma URL "pública" (sem
 * exigir login pra baixar), mas ela nunca é exibida em lugar nenhum do
 * site — só é entregue ao cliente depois da confirmação de pagamento,
 * igual ao fluxo anterior via Supabase Storage.
 */
export async function uploadDigitalFileToCloudinary(file: File, folder: string): Promise<{ url: string }> {
  const randomPublicId = crypto.randomUUID().replace(/-/g, "");
  const { cloudName, apiKey, timestamp, signature, folder: signedFolder, publicId } = await getCloudinarySignatureAction(folder, {
    publicId: randomPublicId,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", signedFolder);
  formData.append("public_id", publicId!);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha no upload do arquivo digital: ${errorBody}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return { url: data.secure_url };
}
