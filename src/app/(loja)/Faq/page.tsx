import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import Accordion from "@/components/ui/Accordion";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { faqItems } from "@/data/faq";

export const metadata: Metadata = { title: "Perguntas Frequentes" };

const topics = Array.from(new Set(faqItems.map((f) => f.topic)));

export default function FaqPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionEyebrow>FAQ</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">Perguntas frequentes</h1>

        <div className="mt-10 flex flex-col gap-10">
          {topics.map((topic) => (
            <div key={topic}>
              <h2 className="text-lg font-semibold text-ink">{topic}</h2>
              <div className="mt-4">
                <Accordion items={faqItems.filter((f) => f.topic === topic)} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-ink-soft">Não encontrou o que precisava?</p>
          <div className="mt-4">
            <WhatsAppButton message="Olá! Tenho uma dúvida que não encontrei no FAQ." />
          </div>
        </div>
      </Container>
    </section>
  );
}
