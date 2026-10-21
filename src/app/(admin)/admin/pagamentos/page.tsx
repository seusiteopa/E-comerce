import CopyLinkButton from "@/components/conta/CopyLinkButton";
import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { startSubscriptionAction } from "@/actions/admin/assinatura";
import DisconnectMercadoPagoButton from "@/components/admin/DisconnectMercadoPagoButton";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatDate } from "@/lib/format";

const subscriptionLabel: Record<string, string> = {
  sem_assinatura: "Sem assinatura",
  pendente: "Aguardando autorização no banco",
  em_teste: "Mês grátis em andamento",
  ativa: "Ativa",
  pausada: "Pausada no Mercado Pago",
  cancelada: "Cancelada",
};

export default async function AdminPagamentosPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const { store } = await requireStoreAdmin();
  const params = await searchParams;
  const supabase = createSupabaseServiceClient();

  const { data: openInvoice } = await supabase
    .from("billing_invoices")
    .select("amount_cents, due_date, pix_qr_code")
    .eq("store_id", store.id)
    .eq("status", "aberta")
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  const [{ data: conn }, { data: billing }] = await Promise.all([
    supabase.from("store_payment_connections").select("status, provider_user_id, expires_at").eq("store_id", store.id).maybeSingle(),
    supabase.from("store_billing").select("*").eq("store_id", store.id).maybeSingle(),
  ]);

  const connected = conn?.status === "conectado";
  const needsSubscription =
    billing?.plan === "mensalidade" && ["sem_assinatura", "pendente", "cancelada", "pausada"].includes(billing.subscription_status);

  return (
    <>
      <AdminHeader title="Pagamentos e plano" />
      <Container className="flex max-w-2xl flex-col gap-6 py-8">
        {params.conectado && <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm">Mercado Pago conectado. Sua loja já pode receber pagamentos online.</p>}
        {params.assinatura && <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm">Obrigado! Assim que o banco confirmar a autorização, o status abaixo é atualizado.</p>}
        {params.erro && <p role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm text-status-danger">Não foi possível concluir a operação. Tente novamente em instantes.</p>}

        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-base font-semibold text-ink">Receber pagamentos (Mercado Pago)</h2>
          {store.is_platform_owned ? (
            <p className="mt-2 text-sm text-ink-soft">Esta é a loja principal da plataforma e usa a conta Mercado Pago principal.</p>
          ) : connected ? (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                Conectado à sua conta Mercado Pago{conn?.expires_at ? ` (autorização renovada automaticamente; vence em ${formatDate(conn.expires_at)})` : ""}. O dinheiro das vendas cai direto na sua conta.
              </p>
              <div className="mt-4"><DisconnectMercadoPagoButton /></div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                {conn?.status === "expirado"
                  ? "A conexão expirou. Conecte de novo para voltar a receber pagamentos online."
                  : "Para receber as vendas da sua loja, você precisa ter uma conta no Mercado Pago. Se ainda não tem, crie uma gratuitamente no site do Mercado Pago. Depois, clique em Conectar Mercado Pago, autorize a conexão e volte para cá. Sem essa conexão, sua loja não consegue receber pagamentos de Pix nem de cartão. O dinheiro das vendas cai direto na sua conta do Mercado Pago. Como funcionam as taxas: o cliente paga exatamente o preço que você definiu. Por exemplo, um produto de R$ 100 é pago por R$ 100 pelo cliente. Sobre esse valor, o Mercado Pago desconta a taxa da venda, e o restante cai na sua conta. A Vecorion não fica com nenhuma parte das vendas: só cobra a mensalidade fixa da loja."}
              </p>
              <div className="mt-4">{/* <a> comum (não <Link>): evita o pré-carregamento do Next iniciar a conexão sem o clique */}
                <a
                  href={`/api/mercadopago/oauth/start?loja=${encodeURIComponent(store.slug)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-farol px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-colors duration-200 hover:bg-farol-deep"
                >
                  Conectar Mercado Pago
                </a></div>
            </>
          )}
        </section>

        {openInvoice && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-base font-semibold text-ink">Mensalidade do mês</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Valor: R$ {(openInvoice.amount_cents / 100).toFixed(2).replace(".", ",")} · vence em{" "}
              {new Date(`${openInvoice.due_date}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
            {openInvoice.pix_qr_code ? (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-sm text-ink">Pague com Pix copiando o código abaixo, no seu banco:</p>
                <code className="break-all rounded-lg bg-paper p-3 text-xs text-ink">{openInvoice.pix_qr_code}</code>
                <CopyLinkButton url={openInvoice.pix_qr_code} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">O código Pix está sendo gerado. Volte em alguns minutos.</p>
            )}
          </div>
        )}
        {!store.is_platform_owned && billing && (
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold text-ink">Seu plano</h2>
            {billing.plan === "comissao" ? (
              <p className="mt-2 text-sm text-ink-soft">
                Comissão de {(billing.commission_bps / 100).toLocaleString("pt-BR")}% sobre cada venda online. Sem mensalidade.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
                <p>Mensalidade de R$ {((billing.monthly_fee_cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por mês, cobrada automaticamente a partir do segundo mês. O primeiro mês é grátis.</p>
                <p>Situação: <strong className="text-ink">{subscriptionLabel[billing.subscription_status] ?? billing.subscription_status}</strong></p>
                {billing.next_due_at && <p>Próxima cobrança: {formatDate(billing.next_due_at)}</p>}
                {billing.billing_status === "atrasada" && (
                  <p className="text-status-danger">Não conseguimos cobrar a última mensalidade. Confira o meio de pagamento autorizado no Mercado Pago.</p>
                )}
              </div>
            )}
            {needsSubscription && (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
                <p className="text-sm font-semibold text-ink">Hoje você paga R$ 0,00.</p>
                <p className="text-sm text-ink-soft">
                  O primeiro mês é grátis. A partir do próximo mês, a mensalidade de R$ {((billing?.monthly_fee_cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} é descontada automaticamente, e a loja continua ativa e vendendo.
                </p>
                <p className="text-sm text-ink-soft">
                  Ao tocar no botão, você vai ao Mercado Pago para autorizar com Pix. Nenhum valor é cobrado nessa autorização.
                </p>
                <form action={startSubscriptionAction}>
                  <Button type="submit">Autorizar com Pix no Mercado Pago</Button>
                </form>
              </div>
            )}
          </section>
        )}
      </Container>
    </>
  );
}
