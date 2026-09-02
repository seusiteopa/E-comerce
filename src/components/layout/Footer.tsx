import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { siteConfig, contact, whatsappHref } from "@/data/site";

const footerNav = [
  { label: "Sobre a Vecorion", href: "/sobre" },
  { label: "FAQ", href: "/faq" },
  { label: "Contato", href: "/contato" },
];

const policies = [
  { label: "Política de Privacidade", href: "/politicas/privacidade" },
  { label: "Termos de Uso", href: "/politicas/termos" },
  { label: "Trocas e Devolução", href: "/politicas/trocas-e-devolucao" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-navy-deep text-white">
      <Container className="grid min-w-0 gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Image src="/brand/vecorion-icone-branco-transparente.png" alt="Vecorion" width={64} height={34} className="h-8 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-white/70">{siteConfig.description}</p>
        </div>

        <nav aria-label="Institucional">
          <h2 className="font-mono-label text-xs uppercase text-white/50">Institucional</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/80 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Políticas">
          <h2 className="font-mono-label text-xs uppercase text-white/50">Políticas</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {policies.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/80 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono-label text-xs uppercase text-white/50">Contato</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/80">
            <li>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="hover:text-white">
                {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-5">
        <Container className="flex flex-col gap-2 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.</p>
          <p>Atendimento online para todo o Brasil.</p>
        </Container>
      </div>
    </footer>
  );
}
