import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import StoreProfileForm from "@/components/admin/StoreProfileForm";
import StorePagesForm from "@/components/admin/StorePagesForm";
import HomeOrderForm from "@/components/admin/HomeOrderForm";
import DeliveryForm from "@/components/admin/DeliveryForm";
import { resolveHomeOrder } from "@/lib/store/home-order";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLojaPage() {
  const { store } = await requireStoreAdmin();
  const deliveryCities = store.delivery_cities ?? [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("stores").select("printer_app").eq("id", store.id).maybeSingle();
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("store_id", store.id)
    .in("key", ["site_description", "contact_email", "instagram_url", "home_order", "page_sobre", "page_faq", "page_contato", "page_politica_privacidade", "page_politica_termos", "page_politica_trocas"]);
  const cfg = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value ?? ""]));
  const pageValues = Object.fromEntries(
    ["page_sobre", "page_faq", "page_contato", "page_politica_privacidade", "page_politica_termos", "page_politica_trocas"].map((k) => [k, cfg[k] ?? ""])
  );

  return (
    <>
      <AdminHeader title="Minha loja" />
      <Container className="max-w-2xl py-8">
        <section className="mb-10 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Área de entrega</h2>
          <p className="mt-1 text-sm text-ink-soft">Esse aviso aparece para o cliente na vitrine, no produto e no checkout.</p>
          <div className="mt-4">
            <DeliveryForm scope={store.delivery_scope} baseCity={store.delivery_base_city} cities={deliveryCities} />
          </div>
        </section>
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
        <HomeOrderForm initial={resolveHomeOrder(cfg.home_order)} />
      </Container>
    </>
  );
}
