import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { generateDigitalDownloadLink } from "@/lib/integrations/storage/digital-delivery";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Downloads" };

export default async function DownloadsPage() {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  // Segurança: o filtro por profile_id + status "pago" acontece aqui, na
  // consulta — só depois disso o product_id é passado para gerar o link
  // assinado. Isso garante que ninguém gera link de download para um
  // produto que não comprou, mesmo que soubesse o productId de outra pessoa.
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_items(id, product_id, product_name_snapshot, product_type_snapshot)")
    .eq("profile_id", profile.id)
    .eq("status", "pago");

  const digitalItems = (orders ?? []).flatMap((o) =>
    o.order_items.filter((i) => i.product_type_snapshot === "digital")
  );

  if (digitalItems.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto digital ainda"
        description="Assim que uma compra for confirmada, seus downloads aparecem aqui."
        action={<LinkButton href="/produtos">Ver produtos</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Meus Downloads</h1>
      <ul className="mt-5 flex flex-col gap-3">
        {await Promise.all(
          digitalItems.map(async (item) => {
            const link = await generateDigitalDownloadLink(item.product_id);
            return (
              <li key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-4">
                <span className="text-sm font-medium text-ink">{item.product_name_snapshot}</span>
                {link ? (
                  <a href={link} className="text-sm font-semibold text-navy hover:underline">Baixar</a>
                ) : (
                  <span className="text-xs text-ink-soft">Indisponível no momento</span>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
