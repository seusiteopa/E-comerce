import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vecorion — Venda online com sua própria loja",
  description:
    "Tenha sua loja online com Pix e cartão pelo Mercado Pago, produtos digitais e físicos, painel completo e prévia pronta para compartilhar no WhatsApp.",
};

const beneficios = [
  {
    titulo: "O dinheiro vai direto para você",
    texto: "Cada venda cai na conta Mercado Pago da sua loja. Sem intermediário no meio do caminho.",
  },
  {
    titulo: "Pix e cartão, do jeito que seu cliente gosta",
    texto: "Seu cliente paga com Pix ou cartão, sem sair da sua loja. O valor que ele vê é o valor final.",
  },
  {
    titulo: "Venda pelo link que você já compartilha",
    texto: "Cada produto e cada loja ganham um link com foto, título e descrição próprios, prontos para o WhatsApp e as redes.",
  },
  {
    titulo: "Painel completo, em qualquer celular",
    texto: "Produtos, pedidos, clientes, cupons, métricas e pedidos de balcão. Você acompanha as vendas de onde estiver.",
  },
];

export default function InicioPlataformaPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">Vecorion</span>
          <Link href="/login" className="text-sm font-medium text-ink hover:underline">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-wide text-navy">Sua loja online</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
          Comece a vender online hoje, com a sua própria loja
        </h1>
        <p className="mt-5 max-w-2xl text-base text-ink-soft sm:text-lg">
          Cadastre seus produtos, receba por Pix e cartão e compartilhe o link da sua loja onde seus clientes já estão.
          Tudo em um só lugar, sem precisar entender de tecnologia.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/criar-loja"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Criar minha loja grátis por 30 dias
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
          >
            Já tenho conta
          </Link>
        </div>

        <section className="mt-16 grid gap-6 sm:grid-cols-2">
          {beneficios.map((b) => (
            <div key={b.titulo} className="rounded-2xl border border-line p-6">
              <h2 className="text-base font-semibold">{b.titulo}</h2>
              <p className="mt-2 text-sm text-ink-soft">{b.texto}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-3xl bg-navy p-8 text-white sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Um custo fixo, sem comissão sobre as suas vendas</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            Você paga uma mensalidade fixa e vende sem pagar nada a mais por venda. O primeiro mês é grátis: você
            autoriza o cartão e começa a usar a loja sem custo. Quanto mais você vende, mais sobra para você.
          </p>
          <Link
            href="/criar-loja"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy hover:opacity-90"
          >
            Quero começar agora
          </Link>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-xl font-semibold sm:text-2xl">Sua loja pronta em poucos minutos</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
            Escolha o tipo de loja, crie a conta, cadastre os produtos e pronto: seu link já está no ar para divulgar.
          </p>
          <Link
            href="/criar-loja"
            className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Criar minha loja
          </Link>
        </section>
      </main>
    </div>
  );
}
