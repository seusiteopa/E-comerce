/**
 * Ajusta uma imagem para o tamanho de compartilhamento (1200 × 630).
 * Fotos do Cloudinary recebem o recorte certo; as demais são usadas como estão.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export function ogImageUrl(url: string): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  return url.replace(marker, `${marker}c_fill,w_1200,h_630,f_jpg,q_auto/`);
}
