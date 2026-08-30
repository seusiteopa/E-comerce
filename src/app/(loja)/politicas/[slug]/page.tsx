import { notFound } from "next/navigation";
import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

const policies: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  privacidade: {
    title: "Política de Privacidade",
    sections: [
      {
        heading: "1. Dados coletados",
        text: "Coletamos os dados necessários para processar seu pedido: nome, e-mail, endereço (quando aplicável) e histórico de compras. Dados de pagamento são processados diretamente pelo Mercado Pago e nunca armazenados em nossos servidores.",
      },
      {
        heading: "2. Uso dos dados",
        text: "Seus dados são usados exclusivamente para processar pedidos, comunicação sobre o status da compra e suporte ao cliente.",
      },
      {
        heading: "3. Seus direitos",
        text: "Você pode solicitar a exportação ou exclusão dos seus dados pessoais entrando em contato pelos canais oficiais da Vecorion.",
      },
    ],
  },
  termos: {
    title: "Termos de Uso",
    sections: [
      {
        heading: "1. Aceitação",
        text: "Ao utilizar a Loja Vecorion, você concorda com estes termos de uso.",
      },
      {
        heading: "2. Produtos",
        text: "A Vecorion comercializa produtos físicos e digitais, cada um com condições específicas descritas em sua respectiva página.",
      },
    ],
  },
  "trocas-e-devolucao": {
    title: "Trocas e Devolução",
    sections: [
      {
        heading: "1. Produtos físicos",
        text: "Produtos físicos podem ser devolvidos em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor, desde que estejam em sua embalagem original.",
      },
      {
        heading: "2. Produtos digitais",
        text: "Por sua natureza, produtos digitais não são passíveis de devolução após o download ser disponibilizado, exceto em caso de defeito comprovado.",
      },
    ],
  },
};

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  return { title: policy?.title ?? "Política não encontrada" };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{policy.title}</h1>

        <div className="mt-10 flex flex-col gap-8">
          {policy.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-lg font-semibold text-ink">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
