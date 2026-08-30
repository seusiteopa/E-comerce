import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { requireAdminProfile } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/site-settings";

export default async function AdminConfiguracoesPage() {
  await requireAdminProfile();
  const settings = await getSiteSettings();

  return (
    <>
      <AdminHeader title="Configurações" />
      <Container className="max-w-2xl py-8">
        <SiteSettingsForm settings={settings} />
      </Container>
    </>
  );
}
