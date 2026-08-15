import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

export default async function AdminConfiguracoesPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("*").order("key");

  return (
    <>
      <AdminHeader title="Configurações" />
      <Container className="max-w-2xl py-8">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Configurações gerais</h2>
          <dl className="mt-4 flex flex-col divide-y divide-line">
            {(data ?? []).map((setting) => (
              <div key={setting.key} className="flex items-center justify-between py-3">
                <dt className="font-mono-label text-xs uppercase text-ink-soft">{setting.key}</dt>
                <dd className="text-sm text-ink">{setting.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-ink-soft">
            Edição via painel fica para uma próxima iteração — hoje, alteração pelo SQL editor do Supabase
            (tabela <code>site_settings</code>).
          </p>
        </div>
      </Container>
    </>
  );
}
