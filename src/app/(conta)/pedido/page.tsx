import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import BriefingForm from "@/components/conta/BriefingForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BRIEF_KINDS, type BriefKind } from "@/lib/briefing/schema";

export const metadata: Metadata = { title: "Fazer um pedido — Vecorion" };

export default async function PedidoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const initialKind: BriefKind = BRIEF_KINDS.find((k) => k === tipo) ?? "site";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const back = encodeURIComponent(`/pedido?tipo=${initialKind}`);

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-md">
        <h1 className="text-3xl font-semibold text-ink">Fazer um pedido</h1>
        {user ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">Conte o que você precisa. Você acompanha tudo e recebe a entrega em Minha conta.</p>
            <BriefingForm initialKind={initialKind} />
          </>
        ) : (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <p className="text-sm text-ink">Para enviar o pedido e acompanhar a entrega, entre na sua conta ou crie uma. É rápido.</p>
            <Link href={`/login?redirecionar=${back}`} className="rounded-full bg-navy px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90">Entrar</Link>
            <Link href="/cadastro" className="rounded-full border border-line px-5 py-3 text-center text-sm font-semibold text-ink hover:bg-paper">Criar minha conta</Link>
            <p className="text-xs text-ink-soft">Depois de criar a conta, volte a esta página para enviar o pedido.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
