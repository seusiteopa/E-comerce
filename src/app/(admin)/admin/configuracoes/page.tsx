import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import StorePagesForm from "@/components/admin/StorePagesForm";
import HomeOrderForm from "@/components/admin/HomeOrderForm";
import { resolveHomeOrder } from "@/lib/store/home-order";
import { requireAdminProfile } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/site-settings";

export default async function AdminConfiguracoesPage() {
  await requireAdminProfile();
  const settings = await getSiteSettings();

  return (
    <>
      <AdminHeader title="Configurações da loja" />
      <Container className="max-w-2xl py-8">
        <SiteSettingsForm settings={settings} />
        <StorePagesForm
          initial={{
            page_sobre: settings.page_sobre ?? "",
            page_faq: settings.page_faq ?? "",
            page_contato: settings.page_contato ?? "",
            page_politica_privacidade: settings.page_politica_privacidade ?? "",
            page_politica_termos: settings.page_politica_termos ?? "",
            page_politica_trocas: settings.page_politica_trocas ?? "",
          }}
        />
        <HomeOrderForm initial={resolveHomeOrder(settings.home_order)} />
      </Container>
    </>
  );
}
