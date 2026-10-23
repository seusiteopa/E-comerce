/** Foto principal do produto: a de menor ordem de exibição, ignorando vídeos. */
export function pickCoverUrl(images: { url: string; display_order: number; media_type: string }[]): string | null {
  const photos = images.filter((i) => i.media_type !== "video" && i.url);
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => a.display_order - b.display_order)[0].url;
}

/** Escapa os caracteres especiais da busca (%, _ e \) para não virar coringa. */
export function escapeSearchTerm(term: string): string {
  return term.trim().replace(/[\\%_]/g, (c) => `\\${c}`).slice(0, 80);
}

export type UnifiedProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  promoPrice: number | null;
  imageUrl: string | null;
  storeName: string;
  storeSlug: string;
  isPlatformOwned: boolean;
  deliveryScope: "local" | "brasil";
  deliveryBaseCity: string | null;
  deliveryCities: string[];
};

/** Produtos ativos de todas as lojas que não estão pausadas, mais recentes primeiro. */
export async function getUnifiedProducts(term: string): Promise<UnifiedProduct[]> {
  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const service = createSupabaseServiceClient();
  let query = service
    .from("products")
    .select(
      "id, slug, name, short_description, price, promo_price, created_at, product_images(url, display_order, media_type), stores!inner(slug, name, is_platform_owned, status, delivery_scope, delivery_base_city, delivery_cities)"
    )
    .eq("status", "ativo")
    .eq("hidden", false)
    .neq("stores.status", "pausada")
    .order("created_at", { ascending: false })
    .limit(60);

  const safe = escapeSearchTerm(term);
  if (safe) query = query.ilike("name", `%${safe}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar a vitrine: ${error.message}`);

  return (data ?? []).map((row) => {
    const store = row.stores as unknown as {
      slug: string; name: string; is_platform_owned: boolean; delivery_scope: "local" | "brasil";
      delivery_base_city: string | null; delivery_cities: string[];
    };
    return {
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      shortDescription: (row.short_description as string | null) ?? null,
      price: Number(row.price),
      promoPrice: row.promo_price == null ? null : Number(row.promo_price),
      imageUrl: pickCoverUrl((row.product_images ?? []) as { url: string; display_order: number; media_type: string }[]),
      storeName: store.name,
      storeSlug: store.slug,
      isPlatformOwned: store.is_platform_owned,
      deliveryScope: store.delivery_scope,
      deliveryBaseCity: store.delivery_base_city,
      deliveryCities: store.delivery_cities ?? [],
    };
  });
}
