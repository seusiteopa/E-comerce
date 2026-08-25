import { createHash } from "crypto";

/**
 * Upload assinado (server-side) para o Cloudinary, sem depender do SDK
 * oficial — apenas fetch + assinatura SHA1, conforme a API de Upload.
 * https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada.`);
  }
  return value;
}

function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video",
  folder: string
): Promise<string> {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const signature = signParams(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha no upload para o Cloudinary (${resourceType}): ${errorBody}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
