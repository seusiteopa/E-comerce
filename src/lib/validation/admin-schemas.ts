import { z } from "zod";

export const productAdminSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto."),
    type: z.enum(["fisico", "digital"]),
    categorySlug: z.string().trim().optional().default(""),
    newCategoryName: z.string().trim().optional().default(""),
    shortDescription: z.string().trim().max(200).optional(),
    description: z.string().trim().min(10, "Descreva o produto com mais detalhe."),
    price: z.number().nonnegative("O preço não pode ser negativo."),
    promoPrice: z.number().nonnegative().optional(),
    status: z.enum(["ativo", "inativo", "rascunho"]).default("rascunho"),
    featured: z.boolean().default(false),
    hidden: z.boolean().default(false),
  })
  .refine((data) => !data.promoPrice || data.promoPrice < data.price, {
    message: "O preço promocional precisa ser menor que o preço normal.",
    path: ["promoPrice"],
  });

export const categoryAdminSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  name: z.string().trim().min(2, "Informe o nome da categoria."),
  description: z.string().trim().optional(),
  productType: z.enum(["fisico", "digital"]),
  parentSlug: z.string().trim().optional(),
});

export const couponAdminSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,20}$/, "Use de 3 a 20 letras/números, sem espaço."),
  discountType: z.enum(["percentual", "fixo"]),
  discountValue: z.number().positive("O valor do desconto precisa ser maior que zero."),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerCustomer: z.number().int().positive().default(1),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["aguardando_pagamento", "pago", "em_separacao", "enviado", "entregue", "cancelado"]),
});
