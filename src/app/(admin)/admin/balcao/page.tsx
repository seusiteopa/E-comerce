import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import CounterOrder, { type CounterProduct } from "@/components/admin/CounterOrder";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminBalcaoPage() {
  const { store } = await requireStoreAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("products")
    .select("id, name, price, promo_price, product_images(url, media_type, display_order)")
    .eq("store_id", store.id)
    .eq("status", "ativo")
    .order("name");

  const products: CounterProduct[] = (data ?? []).map((p) => {
    const images = ((p as unknown as { product_images: { url: string; media_type: string; display_order: number }[] }).product_images ?? [])
      .filter((i) => i.media_type !== "video")
      .sort((a, b) => a.display_order - b.display_order);
    return { id: p.id, name: p.name, price: Number(p.promo_price ?? p.price), image: images[0]?.url ?? null };
  });

  return (
    <>
      <AdminHeader title="Pedido de balcão" />
      <Container className="py-8">
        <CounterOrder products={products} />
      </Container>
    </>
  );
}
