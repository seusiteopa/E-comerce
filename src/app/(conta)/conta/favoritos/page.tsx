import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { mapToProduct, type ProductWithDetails } from "@/lib/data/catalog";
import ProductGrid from "@/components/loja/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("favorites")
    .select(`
      product_id,
      products (
        *,
        product_images ( url, alt_text, display_order, media_type ),
        product_variations ( * ),
        digital_assets ( delivery_type )
      )
    `)
    .eq("profile_id", profile.id);

  const products = (data ?? [])
    .map((row) => row.products)
    .filter(Boolean)
    .map((row) => mapToProduct(row as unknown as ProductWithDetails));

  if (products.length === 0) {
    return (
      <EmptyState
        title="Você ainda não tem favoritos"
        description="Toque no coração de um produto para guardá-lo aqui."
        action={<LinkButton href="/produtos">Ver produtos</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Favoritos</h1>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
