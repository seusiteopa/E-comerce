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
