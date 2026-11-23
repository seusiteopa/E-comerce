import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import ProductForm from "@/components/admin/ProductForm";
import ProductOptionsEditor from "@/components/admin/ProductOptionsEditor";
import { getProductGroups } from "@/lib/produto/opcoes-data";
import CombinationStockEditor from "@/components/admin/CombinationStockEditor";
import CourseLessonsEditor from "@/components/admin/CourseLessonsEditor";
import { getCourseLessons } from "@/lib/curso/aulas-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { CategoryRow, ProductRow } from "@/types/database";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();

  const [{ data: product }, { data: categories }, { data: images }, { data: variation }, { data: digitalAsset }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("store_id", storeId).maybeSingle(),
    supabase.from("categories").select("*").eq("store_id", storeId).eq("active", true).order("display_order"),
    supabase.from("product_images").select("id, url, media_type").eq("product_id", id).order("display_order"),
    supabase.from("product_variations").select("stock").eq("product_id", id).limit(1).maybeSingle(),
    supabase.from("digital_assets").select("storage_path").eq("product_id", id).maybeSingle(),
  ]);

  if (!product) notFound();
  const groups = await getProductGroups(id);
  const lessons = await getCourseLessons(id);
  const isCourseStore = (await getCurrentStore()).store_type === "curso";
  const { data: variationRows } = await supabase.from("product_variations").select("attributes, stock").eq("product_id", id);

  return (
    <>
      <AdminHeader title={`Editar: ${product.name}`} />
      <Container className="max-w-2xl py-8">
        <ProductForm
          categories={(categories ?? []) as CategoryRow[]}
          storeType={(await getCurrentStore()).store_type}
          product={product as ProductRow}
          existingMedia={(images ?? []).map((i) => ({ id: i.id, url: i.url, media_type: i.media_type }))}
          currentStock={variation?.stock ?? 0}
          currentDigitalFileUrl={digitalAsset?.storage_path ?? undefined}
        />
        <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Opções do produto</h2>
          <p className="mt-1 text-sm text-ink-soft">Tamanho, cor, adicionais e remoção de ingredientes.</p>
          <div className="mt-4">
            <ProductOptionsEditor productId={id} initial={groups} />
          </div>
        </section>
        {isCourseStore && (
          <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-base font-semibold text-ink">Aulas do curso</h2>
            <div className="mt-4">
              <CourseLessonsEditor productId={id} initial={lessons.map((l) => ({ title: l.title, videoUrl: l.video_url }))} />
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Estoque por combinação</h2>
          <div className="mt-4">
            <CombinationStockEditor
              productId={id}
              groups={groups.map((g) => ({ name: g.name, mode: g.mode, options: g.options.map((o) => ({ name: o.name })) }))}
              variations={((variationRows ?? []) as { attributes: Record<string, string>; stock: number }[]).map((v) => ({ attributes: v.attributes, stock: v.stock }))}
            />
          </div>
        </section>
      </Container>
    </>
  );
}
