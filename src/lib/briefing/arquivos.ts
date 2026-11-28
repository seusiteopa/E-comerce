import { z } from "zod";

export type BriefFileKind = "entrega" | "referencia";
export type BriefMediaType = "imagem" | "video" | "arquivo";

export const MAX_ENTREGA_MIDIAS = 3;
export const MAX_REFERENCIAS = 10;

/** Só aceitamos endereços do Cloudinary, para ninguém gravar link de qualquer site. */
export function isCloudinaryUrl(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\/[\w-]+\//.test(url);
}

export const fileInputSchema = z.object({
  url: z.string().url().max(600).refine(isCloudinaryUrl, "Endereço de arquivo inválido."),
  mediaType: z.enum(["imagem", "video", "arquivo"]),
  name: z.string().trim().max(160).optional().default(""),
});
export type FileInput = z.input<typeof fileInputSchema>;

export function mediaTypeOf(mime: string): BriefMediaType {
  if (mime.startsWith("image/")) return "imagem";
  if (mime.startsWith("video/")) return "video";
  return "arquivo";
}
