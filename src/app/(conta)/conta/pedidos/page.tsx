import { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { StatusPill } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { groupOrderLines } from "@/lib/pedidos/agrupar";

/** Loja de cursos vende itens digitais, mas o cliente vê esses itens na seção de cursos. */
function storeTypeOf(order: { stores?: unknown }): string | null {
  const st = order.stores as { store_type?: string } | null;
  return st?.store_type ?? null;
}

export const metadata: Metadata = { title: "Meus Pedidos" };

export default async function PedidosPage() {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, payments(status), order_items(product_name_snapshot, product_type_snapshot, quantity, unit_price_snapshot, products(slug)), stores(store_type)")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="Você ainda não tem pedidos"
        description="Explore o catálogo e faça sua primeira compra."
        action={<LinkButton href="/produtos">Ver produtos</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Meus Pedidos</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono-label text-xs text-ink-soft">#{order.id.slice(0, 8)}</p>
                <p className="text-xs text-ink-soft">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={order.status} kind="order" />
                <StatusPill status={order.payments?.[0]?.status ?? "pendente"} kind="payment" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
              {groupOrderLines(
                ((order.order_items ?? []) as { product_name_snapshot: string; product_type_snapshot: string; quantity: number; unit_price_snapshot: number }[]).map((i) => ({
                  name: i.product_name_snapshot,
                  quantity: i.quantity,
                  unitPrice: Number(i.unit_price_snapshot),
                  type: i.product_type_snapshot === "digital" && storeTypeOf(order) === "curso" ? "curso" : i.product_type_snapshot,
                  slug: (i as unknown as { products?: { slug?: string } | null }).products?.slug,
                }))
              ).map((section) => (
                <div key={section.key}>
                  <p className="font-mono-label text-xs uppercase text-ink-soft">{section.label}</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {section.lines.map((line, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 text-sm text-ink">
                        <span>
                          {line.quantity}× {line.name}
                          {section.key === "curso" && line.slug && (
                            <Link href={`/conta/cursos/${line.slug}`} className="ml-3 text-navy hover:underline">Acessar curso →</Link>
                          )}
                        </span>
                        <span className="shrink-0">{formatCurrency(line.unitPrice * line.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  {section.key === "digital" && (
                    <Link href="/conta/downloads" className="mt-2 inline-block text-sm font-semibold text-navy hover:underline">Baixar arquivos →</Link>
                  )}

                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-ink-soft">Total</span>
              <span className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</span>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/conta/downloads" className="mt-6 inline-block text-sm text-navy hover:underline">
        Ver meus downloads →
      </Link>
    </div>
  );
}
