export type ProductType = "fisico" | "digital" | "curso" | "servico";

export type ProductStatus = "ativo" | "inativo" | "rascunho";

export interface Category {
  slug: string;
  name: string;
  description: string;
  productType: ProductType;
  parentSlug?: string;
}

export interface ProductVariation {
  id: string;
  attributes: Record<string, string>; // ex: { tamanho: "M", cor: "Azul" }
  stock: number;
  sku: string;
}

export type CourseLevel = "iniciante" | "intermediario" | "avancado";

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number;
  promoPrice?: number;
  status: ProductStatus;
  featured: boolean;
  images: { url: string; alt: string }[];
  // Campos específicos por tipo (Etapa 3: só o bloco relevante é preenchido)
  variations?: ProductVariation[]; // físico
  digitalFormat?: string; // digital
  courseLevel?: CourseLevel; // curso
  courseModules?: number; // curso
  serviceIncludes?: string[]; // serviço
  isQuoteOnly?: boolean; // serviço sob orçamento
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "em_separacao"
  | "enviado"
  | "entregue"
  | "cancelado";

export type PaymentStatus = "pendente" | "aprovado" | "recusado" | "cancelado" | "reembolsado";

export interface OrderItem {
  productName: string;
  productType: ProductType;
  variationLabel?: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  customerName: string;
}

export interface CartItem {
  productId: string;
  productSlug: string;
  name: string;
  type: ProductType;
  variationId?: string;
  variationLabel?: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  topic: string;
}
