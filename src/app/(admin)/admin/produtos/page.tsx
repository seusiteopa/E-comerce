import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { ProductTypeBadge } from "@/components/ui/Badge";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { ProductRow } from "@/types/database";

type ProductWithImages = ProductRow & { product_images?: { url: string; display_order: number | null }[] | null };

export default async function AdminProdutosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, display_order)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as ProductWithImages[];

  return (
    <>
      <AdminHeader title="Produtos" />
      <Container className="py-8">
        <div className="mb-5 flex justify-end">
          <LinkButton href="/admin/produtos/novo">Novo produto</LinkButton>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
            Nenhum produto cadastrado ainda.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {rows.map((r) => {
              const cover = [...(r.product_images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
              const promo = (r as ProductRow & { promo_price?: number | null }).promo_price;
              return (
                <li key={r.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="aspect-square w-full overflow-hidden bg-paper">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.url} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-ink-soft">Sem foto</div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductTypeBadge type={r.type} />
                      <span className="text-xs uppercase text-ink-soft">{r.status}</span>
                    </div>
                    <p className="truncate font-semibold text-ink" title={r.name}>{r.name}</p>
                    <div className="text-sm">
                      {promo ? (
                        <>
                          <span className="font-semibold text-navy">{formatCurrency(Number(promo))}</span>{" "}
                          <span className="text-xs text-ink-soft line-through">{formatCurrency(Number(r.price))}</span>
                        </>
                      ) : (
                        <span className="font-semibold text-ink">{formatCurrency(Number(r.price))}</span>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                      <Link href={`/admin/produtos/${r.id}/editar`} className="text-xs font-semibold text-navy hover:underline">
                        Editar
                      </Link>
                      <Link href={`/produtos/${r.slug}`} className="text-xs font-semibold text-ink-soft hover:underline">
                        Ver na loja
                      </Link>
                      <DeleteProductButton productId={r.id} productName={r.name} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
