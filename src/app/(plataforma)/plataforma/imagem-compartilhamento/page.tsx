import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import OgImageForm from "@/components/plataforma/OgImageForm";

export const metadata: Metadata = { title: "Imagem de compartilhamento", robots: { index: false, follow: false } };

export default function PlataformaImagemPage() {
  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Imagem de compartilhamento da página inicial</h1>
        <div className="mt-8 max-w-xl">
          <OgImageForm />
        </div>
      </Container>
    </section>
  );
}
