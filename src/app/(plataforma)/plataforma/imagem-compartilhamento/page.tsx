import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import OgImageForm from "@/components/plataforma/OgImageForm";

export const metadata: Metadata = { title: "Imagens da página inicial", robots: { index: false, follow: false } };

export default function PlataformaImagemPage() {
  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Plataforma</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Imagens da página inicial</h1>
        <div className="mt-8 flex max-w-xl flex-col gap-8">
          <div>
            <h2 className="mb-3 text-base font-semibold text-ink">Logo da Vecorion</h2>
            <OgImageForm kind="logo" />
          </div>
          <div>
            <h2 className="mb-3 text-base font-semibold text-ink">Imagem de compartilhamento do link</h2>
            <OgImageForm kind="og" />
          </div>
        </div>
      </Container>
    </section>
  );
}
