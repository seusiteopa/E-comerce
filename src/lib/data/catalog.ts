import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategoryRow, ProductRow, ProductVariationRow } from "@/types/database";
import { Product } from "@/types";

export interface ProductWithDetails extends ProductRow {
  product_images: { url: string; alt_text: string; display_order: number; media_type: string }[];
  product_variations: ProductVariationRow[];
  digital_assets: { delivery_type: string }[];
}

export async function getActiveCategories(): Promise<CategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("display_order");

  if (error) throw new Error(`Falha ao carregar categorias: ${error.message}`);
  return data;
}

export async function getTopLevelCategories(): Promise<CategoryRow[]> {
  const categories = await getActiveCategories();
  return categories.filter((c) => !c.parent_slug);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  return data;
}

const PRODUCT_DETAIL_SELECT = `
  *,
  product_images ( url, alt_text, display_order, media_type ),
  product_variations ( * ),
  digital_assets ( delivery_type )
`;

export async function getActiveProducts(): Promise<ProductWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("status", "ativo")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar produtos: ${error.message}`);
  return data as unknown as ProductWithDetails[];
}

export async function getFeaturedProducts(): Promise<ProductWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("status", "ativo")
    .eq("hidden", false)
    .eq("featured", true)
    .limit(8);

  if (error) throw new Error(`Falha ao carregar produtos em destaque: ${error.message}`);
  return data as unknown as ProductWithDetails[];
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("status", "ativo")
    .eq("hidden", false)
    .eq("category_slug", categorySlug);

  if (error) throw new Error(`Falha ao carregar produtos da categoria: ${error.message}`);
  return data as unknown as ProductWithDetails[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();

  return data as unknown as ProductWithDetails | null;
}

export async function getRelatedProducts(product: ProductRow, limit = 3): Promise<ProductWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("status", "ativo")
    .eq("hidden", false)
    .eq("category_slug", product.category_slug)
    .neq("id", product.id)
    .limit(limit);

  if (error) return [];
  return data as unknown as ProductWithDetails[];
}

export async function searchProducts(query: string): Promise<ProductWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("status", "ativo")
    .eq("hidden", false)
    .or(`name.ilike.%${query}%,short_description.ilike.%${query}%`)
    .limit(30);

  if (error) throw new Error(`Falha na busca: ${error.message}`);
  return data as unknown as ProductWithDetails[];
}

export function mapToProduct(row: ProductWithDetails): Product {
  const digitalAsset = row.digital_assets?.[0];

  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({ url: img.url, alt: img.alt_text, mediaType: (img.media_type as "imagem" | "video") ?? "imagem" }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    categorySlug: row.category_slug,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    price: Number(row.price),
    promoPrice: row.promo_price ? Number(row.promo_price) : undefined,
    status: row.status,
    featured: row.featured,
    images: images.length > 0 ? images : [{ url: "/placeholder-product.svg", alt: row.name, mediaType: "imagem" as const }],
    variations: row.product_variations?.map((v) => ({
      id: v.id,
      attributes: v.attributes,
      stock: v.stock,
      sku: v.sku,
    })),
    digitalFormat: digitalAsset?.delivery_type,
  };
}
