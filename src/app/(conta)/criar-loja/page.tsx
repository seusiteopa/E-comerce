import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import CreateStoreForm from "@/components/conta/CreateStoreForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { monthlyFeeFromEnv } from "@/lib/integrations/mercadopago/subscription";

export const metadata: Metadata = { title: "Criar minha loja — Vecorion" };

export default async function CriarLojaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fee = monthlyFeeFromEnv();

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-md">
        <h1 className="text-3xl font-semibold text-ink">Criar minha loja</h1>
        <p className="mt-2 text-sm text-ink-soft">Monte sua loja online em minutos: catálogo, pedidos, Pix, balcão e impressão de cupom.</p>

        {user ? (
          <CreateStoreForm
            rootDomain={process.env.PLATFORM_ROOT_DOMAIN ?? null}
            monthlyFee={fee ? fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : null}
          />
        ) : (
          <div className="mt-8 flex flex-col gap-3 text-sm text-ink">
            <p>Primeiro, entre ou crie sua conta. Depois volte aqui para cadastrar a loja.</p>
            <Link href="/cadastro" className="font-semibold text-navy underline">Criar conta</Link>
            <Link href="/login?redirecionar=/criar-loja" className="font-semibold text-navy underline">Já tenho conta — entrar</Link>
          </div>
        )}
      </Container>
    </section>
  );
}
