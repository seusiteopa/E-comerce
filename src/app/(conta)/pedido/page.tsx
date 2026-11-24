import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import BriefingForm from "@/components/conta/BriefingForm";
import { BRIEF_KINDS, type BriefKind } from "@/lib/briefing/schema";

export const metadata: Metadata = { title: "Fazer um pedido — Vecorion" };

export default async function PedidoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const initialKind: BriefKind = BRIEF_KINDS.find((k) => k === tipo) ?? "site";

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-md">
        <h1 className="text-3xl font-semibold text-ink">Fazer um pedido</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Conte o que você precisa. Não é preciso criar conta: respondemos pelo WhatsApp.
        </p>
        <BriefingForm initialKind={initialKind} />
      </Container>
    </section>
  );
}
