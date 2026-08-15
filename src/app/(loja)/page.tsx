import { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Confirmação do pedido" };

interface ConfirmacaoPageProps {
  searchParams: Promise<{ pedido?: string }>;
}

export default async function ConfirmacaoPage({ searchParams }: ConfirmacaoPageProps) {
  const { pedido } = await searchParams;

  if (!pedido) {
    return (
      <Container className="py-20 text-center">
        <p className="text-ink-soft">Nenhum pedido informado.</p>
        <LinkButton href="/produtos" className="mt-6">Ver produtos</LinkButton>
      </Container>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, payments(status)")
    .eq("id", pedido)
    .maybeSingle();

  return (
    <section className="py-20">
      <Container className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold text-ink">Pedido recebido!</h1>

        {order ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-left">
            <div className="flex items-center justify-between">
              <span className="font-mono-label text-xs uppercase text-ink-soft">Pedido</span>
              <span className="font-mono-label text-xs text-ink">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Status do pagamento</span>
              <StatusPill status={order.payments?.[0]?.status ?? "pendente"} kind="payment" />
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              A confirmação final do pagamento pode levar alguns instantes (especialmente Pix e boleto).
              Você pode acompanhar em <Link href="/conta/pedidos" className="text-navy hover:underline">Meus Pedidos</Link>.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-soft">
            Não encontramos os detalhes deste pedido agora, mas se o pagamento foi concluído, ele já está sendo processado.
          </p>
        )}

        <LinkButton href="/produtos" variant="secondary" className="mt-8">
          Continuar comprando
        </LinkButton>
      </Container>
    </section>
  );
}
