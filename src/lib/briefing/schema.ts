import { z } from "zod";

export const BRIEF_KINDS = ["site", "imagens", "videos"] as const;
export type BriefKind = (typeof BRIEF_KINDS)[number];

export const BRIEF_LABEL: Record<BriefKind, string> = {
  site: "Site personalizado",
  imagens: "Imagens e banners",
  videos: "Vídeos",
};

export const BRIEF_STATUS = ["novo", "em_atendimento", "concluido"] as const;
export type BriefStatus = (typeof BRIEF_STATUS)[number];

export const BRIEF_STATUS_LABEL: Record<BriefStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
};

/** Só os números do WhatsApp; aceita com ou sem o 55 do Brasil. */
export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export const briefSchema = z.object({
  kind: z.enum(BRIEF_KINDS),
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  whatsapp: z
    .string()
    .trim()
    .transform(normalizeWhatsapp)
    .refine((v) => v.length >= 12 && v.length <= 13, "Informe um WhatsApp com DDD."),
  email: z.string().trim().max(160).email("E-mail inválido.").optional().or(z.literal("")),
  business: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().min(10, "Conte um pouco mais do que você precisa.").max(2000),
  references: z.string().trim().max(1000).optional().default(""),
  deadline: z.string().trim().max(80).optional().default(""),
  website: z.string().optional().default(""), // campo isca: pessoas não veem, robôs preenchem
});

export type BriefInput = z.input<typeof briefSchema>;

export function whatsappLink(digits: string): string {
  return `https://wa.me/${normalizeWhatsapp(digits)}`;
}
