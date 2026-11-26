import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import StoreLink from "@/components/store/StoreLink";
import { requireAdminProfile } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/site-settings";

export default async function AdminConfiguracoesPage() {
  await requireAdminProfile();
  const settings = await getSiteSettings();

  return (
    <>
      <AdminHeader title="Aparência e promoções" />
      <Container className="max-w-2xl py-8">
        <p className="mb-6 text-sm text-ink-soft">
          Aqui ficam a faixa de avisos, as cores e o cupom de boas-vindas. Nome, endereço, páginas, ordem da página inicial e área de entrega estão em{" "}
          <StoreLink href="/admin/loja" className="font-semibold text-navy hover:underline">Minha loja</StoreLink>.
        </p>
        <SiteSettingsForm settings={settings} />
      </Container>
    </>
  );
}
