import { customStorePage } from "@/lib/store/store-pages";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { contact } from "@/data/site";
import { getSiteSettings } from "@/lib/data/site-settings";

export default async function ContatoPage() {
  const custom = await customStorePage("contato");
  if (custom) return custom;
  const settings = await getSiteSettings();
  const whatsappNumber = settings.whatsapp_number?.trim();
  const email = settings.contact_email?.trim() || (settings._platform === "1" ? contact.email : "");

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid min-w-0 gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionEyebrow>Contato</SectionEyebrow>
          <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">Fale com a gente</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
            Atendimento 100% online para todo o Brasil.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <WhatsAppButton phone={whatsappNumber} />
            {email && (
              <a href={`mailto:${email}`} className="text-sm font-semibold text-navy hover:underline">
                {email}
              </a>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7">
          <h2 className="text-lg font-semibold text-ink">Prefere WhatsApp?</h2>
          <p className="mt-3 text-sm text-ink-soft">
            É o canal mais rápido para tirar dúvidas sobre produtos.
          </p>
          <div className="mt-5">
            <WhatsAppButton phone={whatsappNumber} />
          </div>
        </div>
      </Container>
    </section>
  );
}
