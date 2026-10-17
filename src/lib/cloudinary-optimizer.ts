/**
 * Otimiza uma URL do Cloudinary para exibição web.
 * Adiciona transformações: WebP automático, resizing, quality
 */
export function optimizeCloudinaryUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: "auto" | "low" | "high";
}): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url; // Se não for Cloudinary, retorna como está
  }

  const { width, height, quality = "auto" } = options || {};

  // Formato: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
  // Inserir transformações entre /upload/ e o public_id
  const parts = url.split("/upload/");
  if (parts.length !== 2) {
    return url; // URL inválida, retorna original
  }

  const transformations = [];

  // WebP automático com fallback para JPEG
  transformations.push("f_auto");

  // Quality: auto (inteligente), low (40), high (85)
  if (quality === "auto") {
    transformations.push("q_auto");
  } else if (quality === "low") {
    transformations.push("q_40");
  } else if (quality === "high") {
    transformations.push("q_85");
  }

  // Resizing com fill (preenche sem distorcer)
  if (width || height) {
    const w = width ? `w_${width}` : "";
    const h = height ? `h_${height}` : "";
    const fill = "c_fill";
    transformations.push([w, h, fill].filter(Boolean).join(","));
  }

  const transformString = transformations.join("/");
  return `${parts[0]}/upload/${transformString}/${parts[1]}`;
}
