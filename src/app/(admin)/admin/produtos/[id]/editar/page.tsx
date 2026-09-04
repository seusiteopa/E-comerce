import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import ProductForm from "@/components/admin/ProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";
import { CategoryRow, ProductRow } from "@/types/database";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: product }, { data: categories }, { data: images }, { data: variation }, { data: digitalAsset }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").eq("active", true).order("display_order"),
    supabase.from("product_images").select("id, url, media_type").eq("product_id", id).order("display_order"),
    supabase.from("product_variations").select("stock").eq("product_id", id).limit(1).maybeSingle(),
    supabase.from("digital_assets").select("storage_path").eq("product_id", id).maybeSingle(),
  ]);

  if (!product) notFound();

  return (
    <>
      <AdminHeader title={`Editar: ${product.name}`} />
      <Container className="max-w-2xl py-8">
        <ProductForm
          categories={(categories ?? []) as CategoryRow[]}
          product={product as ProductRow}
          existingMedia={(images ?? []).map((i) => ({ id: i.id, url: i.url, media_type: i.media_type }))}
          currentStock={variation?.stock ?? 0}
          currentDigitalFileUrl={digitalAsset?.storage_path ?? undefined}
        />
      </Container>
    </>
  );
}
