import StoreLink from "@/components/store/StoreLink";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { siteConfig, contact, whatsappHref } from "@/data/site";
import type { SiteSettingsMap } from "@/lib/data/site-settings";
import { STORE_PAGES, storePageText, type StorePageSlug } from "@/lib/store/store-pages-config";

const footerNav = [
  { label: "Sobre", href: "/sobre" },
  { label: "FAQ", href: "/faq" },
  { label: "Contato", href: "/contato" },
];

const policies = [
  { label: "Política de Privacidade", href: "/politicas/privacidade" },
  { label: "Termos de Uso", href: "/politicas/termos" },
  { label: "Trocas e Devolução", href: "/politicas/trocas-e-devolucao" },
];

/**
 * Todo texto/contato aqui pode vir das configurações do admin (com
 * fallback pro padrão da Vecorion) — importante pra loja funcionar
 * como modelo pra outros clientes sem misturar as informações deles
 * com as da Vecorion.
 */
export default function Footer({ settings }: { settings?: SiteSettingsMap }) {
  const storeName = settings?.site_name?.trim() || siteConfig.storeName;
  const isPlatform = settings?._platform === "1" || settings === undefined;
  const description = settings?.site_description?.trim() || (isPlatform ? siteConfig.description : "");
  const whatsappNumber = settings?.whatsapp_number?.trim();
  const email = settings?.contact_email?.trim() || (isPlatform ? contact.email : "");
  const instagramUrl = settings?.instagram_url?.trim() || (isPlatform ? contact.instagram : "");
  const logoUrl = settings?.logo_url;

  const pageSlugOf = (href: string) => (Object.keys(STORE_PAGES) as StorePageSlug[]).find((k) => STORE_PAGES[k].href === href);
  const hasPage = (href: string) => {
    const slug = pageSlugOf(href);
    return isPlatform || (slug !== undefined && storePageText(settings, slug) !== "");
  };
  const visibleFooterNav = footerNav.filter((i) => hasPage(i.href));
  const visiblePolicies = policies.filter((i) => hasPage(i.href));

  return (
    <footer className="border-t border-line bg-navy-deep text-white">
      <Container className="grid min-w-0 gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
          ) : (
            <Image src="/brand/vecorion-icone-branco-transparente.png" alt={storeName} width={64} height={34} className="h-8 w-auto" />
          )}
          <p className="mt-4 max-w-xs text-sm text-white/70">{description}</p>
        </div>

        {isPlatform && (
        <nav aria-label="Institucional">
          <h2 className="font-mono-label text-xs uppercase text-white/50">Institucional</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {visibleFooterNav.map((item) => (
              <li key={item.href}>
                <StoreLink href={item.href} className="text-sm text-white/80 hover:text-white">
                  {item.label}
                </StoreLink>
              </li>
            ))}
          </ul>
        </nav>
        )}

        {isPlatform && (
        <nav aria-label="Políticas">
          <h2 className="font-mono-label text-xs uppercase text-white/50">Políticas</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {visiblePolicies.map((item) => (
              <li key={item.href}>
                <StoreLink href={item.href} className="text-sm text-white/80 hover:text-white">
                  {item.label}
                </StoreLink>
              </li>
            ))}
          </ul>
        </nav>
        )}

        <div>
          <h2 className="font-mono-label text-xs uppercase text-white/50">Contato</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/80">
            {whatsappNumber !== "" && (
            <li>
              <a href={whatsappHref(undefined, whatsappNumber)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </li>
            )}
            {email && (
            <li>
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </li>
            )}
            {instagramUrl && (
            <li>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-5">
        <Container className="flex flex-col gap-2 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
          <p>Atendimento online para todo o Brasil.</p>
        </Container>
      </div>
    </footer>
  );
}
