/** Imagem de compartilhamento da plataforma (página inicial). Separada da imagem de cada loja. */
export const OG_SETTING_KEY = "og_image_plataforma";
export const OG_MAX_BYTES = 800_000;

/** Converte "data:image/png;base64,..." em tipo e bytes. Null se não for uma imagem aceita. */
export function parseImageDataUrl(dataUrl: string): { type: string; bytes: Uint8Array } | null {
  const m = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const bytes = Uint8Array.from(Buffer.from(m[3], "base64"));
  if (bytes.length === 0 || bytes.length > OG_MAX_BYTES) return null;
  return { type: m[1], bytes };
}
