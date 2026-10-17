import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vecorion — Crie sua loja online",
  description: "Crie sua loja online na Vecorion: venda produtos digitais e físicos com pagamento pelo Mercado Pago.",
};

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
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">Crie sua loja online em minutos</h1>
        <p className="mt-5 max-w-2xl text-base text-ink-soft sm:text-lg">
          Cadastre sua loja, cadastre seus produtos e receba pagamentos pelo Mercado Pago, com painel próprio para
          acompanhar pedidos e vendas.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/criar-loja"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Criar minha loja
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
          >
            Já tenho conta
          </Link>
        </div>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-line p-6">
            <h2 className="text-base font-semibold">Comissão ou mensalidade</h2>
            <p className="mt-2 text-sm text-ink-soft">Escolha o plano que faz mais sentido para o seu volume de vendas.</p>
          </div>
          <div className="rounded-2xl border border-line p-6">
            <h2 className="text-base font-semibold">Pagamento direto</h2>
            <p className="mt-2 text-sm text-ink-soft">O dinheiro das vendas vai para a conta Mercado Pago da sua loja.</p>
          </div>
          <div className="rounded-2xl border border-line p-6">
            <h2 className="text-base font-semibold">Painel da loja</h2>
            <p className="mt-2 text-sm text-ink-soft">Produtos, pedidos, pagamentos, logo e pedidos de balcão em um lugar só.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
