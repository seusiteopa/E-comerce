import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).default("Principal"),
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Use a sigla do estado (ex: SP)."),
});

export const quoteRequestSchema = z.object({
  contactName: z.string().trim().min(2, "Informe seu nome."),
  contactEmail: z.string().trim().email("E-mail inválido."),
  contactPhone: z.string().trim().optional(),
  serviceProductId: z.string().uuid("Serviço inválido."),
  message: z.string().trim().min(10, "Descreva com um pouco mais de detalhe o que você precisa."),
});

export const createOrderItemSchema = z.object({
  productId: z.string().uuid(),
  variationId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, "O carrinho está vazio."),
  addressId: z.string().uuid().optional(),
  couponCode: z.string().trim().optional(),
  shippingMethod: z.enum(["pac", "sedex"]).optional(),
  payerDocument: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "CPF inválido — informe apenas os 11 números."),
  paymentMethod: z.enum(["pix", "cartao", "boleto"]).default("pix"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
