/**
 * Tipos derivados do schema definido em supabase/migrations/.
 * Em um ambiente com projeto Supabase real conectado, estes tipos devem
 * ser substituídos pela geração automática (`supabase gen types typescript`),
 * conforme decidido na Etapa 7 (Seção 5) — mantidos manuais aqui porque
 * ainda não há projeto Supabase provisionado nesta etapa.
 */

export type UserRole = "cliente" | "administrador";
export type ProductType = "fisico" | "digital" | "curso" | "servico";
export type ProductStatus = "ativo" | "inativo" | "rascunho";
export type OrderStatus = "aguardando_pagamento" | "pago" | "em_separacao" | "enviado" | "entregue" | "cancelado";
export type PaymentStatus = "pendente" | "aprovado" | "recusado" | "cancelado" | "reembolsado";

export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  document: string | null;
  role: UserRole;
  created_at: string;
}

export interface AddressRow {
  id: string;
  profile_id: string;
  label: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
}

export interface CategoryRow {
  slug: string;
  name: string;
  description: string | null;
  product_type: ProductType;
  parent_slug: string | null;
  display_order: number;
  active: boolean;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  category_slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  promo_price: number | null;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariationRow {
  id: string;
  product_id: string;
  attributes: Record<string, string>;
  stock: number;
  sku: string;
  weight_grams: number | null;
  width_cm: number | null;
  height_cm: number | null;
  length_cm: number | null;
}

export interface OrderRow {
  id: string;
  profile_id: string;
  address_id: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  variation_id: string | null;
  product_name_snapshot: string;
  product_type_snapshot: ProductType;
  unit_price_snapshot: number;
  quantity: number;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  external_reference: string | null;
  method: string | null;
  amount: number;
  status: PaymentStatus;
  updated_at: string;
}

export interface CouponRow {
  code: string;
  discount_type: "percentual" | "fixo";
  discount_value: number;
  scope_category_slug: string | null;
  scope_product_id: string | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  active: boolean;
}

export interface QuoteRequestRow {
  id: string;
  profile_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  service_product_id: string;
  message: string;
  status: "novo" | "em_contato" | "respondido" | "encerrado";
  created_at: string;
}
