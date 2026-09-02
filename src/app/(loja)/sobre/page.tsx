import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export const metadata: Metadata = {
  title: "Sobre a Vecorion",
  description: "Conheça a história, missão e valores da Vecorion.",
};

const values = ["Inovação", "Simplicidade", "Ética e transparência", "Foco no cliente", "Qualidade", "Aprendizado contínuo", "Acessibilidade"];

export default function SobrePage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionEyebrow>Sobre</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">A Vecorion</h1>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          A Vecorion nasceu em 2026 com o propósito de criar soluções digitais modernas, unindo tecnologia,
          inteligência artificial e inovação para facilitar a vida de pessoas, profissionais e empresas.
        </p>

        <div className="mt-10 rounded-2xl border border-line bg-surface p-7">
          <h2 className="text-xl font-semibold text-ink">Missão</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Apoiar pessoas e pequenos negócios com tecnologia simples, acessível e humana, ajudando cada ideia a
            ganhar vida no mundo digital.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Valores</h2>
          <ul className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            {values.map((v) => (
              <li key={v} className="flex items-center gap-3 text-sm text-ink-soft">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy" aria-hidden="true" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
