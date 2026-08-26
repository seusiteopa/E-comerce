import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import BannerForm from "@/components/admin/BannerForm";
import BannerListItem from "@/components/admin/BannerListItem";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  active: boolean;
  media_type: string;
}

export default async function AdminBannersPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("banners")
    .select("id, title, image_url, link_url, position, active, media_type")
    .order("display_order");
  const rows = (data ?? []) as BannerRow[];

  return (
    <>
      <AdminHeader title="Banners" />
      <Container className="py-8">
        <p className="mb-6 max-w-2xl text-sm text-ink-soft">
          O banner &quot;Principal&quot; ativo aparece no topo da loja. Se nenhum estiver ativo, a home mostra um
          visual padrão simples.
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <BannerForm />

          <div className="flex flex-col gap-3">
            {rows.length === 0 && (
              <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
                Nenhum banner cadastrado ainda.
              </p>
            )}
            {rows.map((banner) => (
              <BannerListItem key={banner.id} banner={banner} />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
