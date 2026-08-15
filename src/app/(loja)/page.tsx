"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import Button from "@/components/ui/Button";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { contact } from "@/data/site";
import { createQuoteRequestAction } from "@/actions/orcamentos";

function ContatoContent() {
  const searchParams = useSearchParams();
  const isOrcamento = searchParams.get("assunto") === "orcamento";
  const produtoId = searchParams.get("produto") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createQuoteRequestAction(formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionEyebrow>Contato</SectionEyebrow>
          <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">Fale com a gente</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
            Atendimento 100% online para todo o Brasil.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <WhatsAppButton />
            <a href={`mailto:${contact.email}`} className="text-sm font-semibold text-navy hover:underline">
              {contact.email}
            </a>
          </div>
        </div>

        {isOrcamento ? (
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-lg font-semibold text-ink">Solicitar orçamento</h2>
            {submitted ? (
              <p className="mt-4 text-sm text-status-success">
                Recebemos sua solicitação! Nossa equipe entrará em contato em breve.
              </p>
            ) : (
              <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
                <input type="hidden" name="serviceProductId" value={produtoId} />
                <Field id="contactName" label="Nome" type="text" />
                <Field id="contactEmail" label="E-mail" type="email" />
                <Field id="contactPhone" label="Telefone (opcional)" type="tel" required={false} />
                <div>
                  <label htmlFor="message" className="text-sm font-medium text-ink">Conte o que você precisa</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-navy"
                  />
                </div>
                {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Enviando..." : "Enviar solicitação"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-lg font-semibold text-ink">Prefere WhatsApp?</h2>
            <p className="mt-3 text-sm text-ink-soft">
              É o canal mais rápido para tirar dúvidas sobre produtos, cursos ou serviços.
            </p>
            <div className="mt-5">
              <WhatsAppButton />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

function Field({ id, label, type, required = true }: { id: string; label: string; type: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-navy"
      />
    </div>
  );
}

export default function ContatoPage() {
  return (
    <Suspense fallback={null}>
      <ContatoContent />
    </Suspense>
  );
}
