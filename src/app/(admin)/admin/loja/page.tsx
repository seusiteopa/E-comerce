import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import StoreProfileForm from "@/components/admin/StoreProfileForm";
import StorePagesForm from "@/components/admin/StorePagesForm";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLojaPage() {
  const { store } = await requireStoreAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("stores").select("printer_app").eq("id", store.id).maybeSingle();
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("store_id", store.id)
    .in("key", ["site_description", "contact_email", "instagram_url"]);
  const cfg = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value ?? ""]));

  return (
    <>
      <AdminHeader title="Minha loja" />
      <Container className="max-w-2xl py-8">
        <StoreProfileForm
          folder={`vecorion/lojas/${store.slug}`}
          store={{
            name: store.name,
            footer_text: cfg.site_description ?? "",
            contact_email: cfg.contact_email ?? "",
            instagram_url: cfg.instagram_url ?? "",
            description: store.description ?? "",
            whatsapp: store.whatsapp ?? "",
            og_title: store.og_title ?? "",
            og_description: store.og_description ?? "",
            og_image_url: store.og_image_url ?? "",
            logo_url: store.logo_url ?? "",
            printer_app: data?.printer_app === "rawbt" ? "rawbt" : "thermer",
          }}
        />
        <StorePagesForm initial={pageValues} />
      </Container>
    </>
  );
}
