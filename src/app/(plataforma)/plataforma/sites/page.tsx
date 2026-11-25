import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { requirePlatformPage } from "@/lib/platform";
import SiteDeliveryForm from "@/components/plataforma/SiteDeliveryForm";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Sites dos clientes", robots: { index: false, follow: false } };

export default async function PlataformaSitesPage() {
  await requirePlatformPage();
  const service = createSupabaseServiceClient();
  const { data: product } = await service.from("products").select("id").eq("slug", "site-personalizado").maybeSingle();
  const { data: items } = product
    ? await service
        .from("order_items")
        .select("order_id, orders(id, created_at, customer_name, payer_email, profiles(full_name, phone), payments(status))")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
    : { data: [] as { order_id: string; orders: unknown }[] };

  const { data: published } = await service
    .from("site_deliveries")
    .select("slug, updated_at, orders(customer_name, payer_email, profiles(full_name))")
    .order("updated_at", { ascending: false });
  const sites = (published ?? []).map((s) => {
    const o = s.orders as unknown as { customer_name: string | null; payer_email: string | null; profiles: { full_name: string | null } | null } | null;
    return { slug: s.slug as string, updated_at: s.updated_at as string, cliente: o?.profiles?.full_name ?? o?.customer_name ?? o?.payer_email ?? "Cliente" };
  });

  const paid = (items ?? []).flatMap((i) => {
    const o = i.orders as unknown as {
      id: string; created_at: string; customer_name: string | null; payer_email: string | null;
      profiles: { full_name: string | null; phone: string | null } | null; payments: { status: string }[] | null;
    } | null;
    if (!o || !(o.payments ?? []).some((p) => p.status === "aprovado")) return [];
    return [{ ...o }];
  });

  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Sites dos clientes</h1>
        <p className="mt-2 text-sm text-ink-soft">Pedidos de site pagos. Depois de construir o site, envie o arquivo HTML e escolha o endereço. O link fica em /sites/nome-do-cliente.</p>
        <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Sites já publicados ({sites.length})</h2>
          {sites.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Nenhum site publicado ainda.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {sites.map((s) => (
                <li key={s.slug} className="flex flex-wrap items-center justify-between gap-2 text-ink">
                  <a href={`/sites/${s.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy hover:underline">/sites/{s.slug}</a>
                  <span className="text-ink-soft">{s.cliente} · {new Date(s.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {paid.length === 0 && <p className="text-sm text-ink-soft">Nenhum pedido de site pago ainda.</p>}
          {paid.map((o) => (
            <div key={o.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink">
                {o.profiles?.full_name ?? o.customer_name ?? "Cliente"} · {o.payer_email ?? "sem e-mail"} · {o.profiles?.phone ?? "sem telefone"}
              </p>
              <p className="text-xs text-ink-soft">Pedido #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              <SiteDeliveryForm orderId={o.id} initialSlug="" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
