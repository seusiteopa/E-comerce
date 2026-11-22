import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SalesByType = { type: string; total: number; count: number };

/** Vendas aprovadas dos últimos 30 dias, agrupadas pelo tipo da loja. */
export async function loadSalesByType(): Promise<SalesByType[]> {
  const service = createSupabaseServiceClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await service
    .from("payments")
    .select("amount, orders!inner(created_at, stores!inner(store_type))")
    .eq("status", "aprovado")
    .gte("orders.created_at", since);

  const totals = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    const order = row.orders as unknown as { stores: { store_type: string } };
    const key = order?.stores?.store_type ?? "misto";
    const acc = totals.get(key) ?? { total: 0, count: 0 };
    acc.total += Number(row.amount);
    acc.count += 1;
    totals.set(key, acc);
  }
  return [...totals.entries()].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.total - a.total);
}
