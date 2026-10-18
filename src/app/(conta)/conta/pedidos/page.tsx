import { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { StatusPill } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Meus Pedidos" };

export default async function PedidosPage() {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, payments(status)")
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
