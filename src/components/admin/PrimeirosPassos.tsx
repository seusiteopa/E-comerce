import { requireStoreAdmin } from "@/lib/auth";
import StoreLink from "@/components/store/StoreLink";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Lista de primeiros passos do lojista. Some quando tudo estiver feito. */
export default async function PrimeirosPassos() {
  const { store } = await requireStoreAdmin();
  const service = createSupabaseServiceClient();
  const [{ count: products }, { data: hours }, { data: conn }] = await Promise.all([
    service.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
    service.from("store_hours").select("weekday").eq("store_id", store.id).limit(1),
    service.from("store_payment_connections").select("status").eq("store_id", store.id).maybeSingle(),
  ]);

  const steps = [
    { done: (products ?? 0) > 0, label: "Cadastrar seus primeiros produtos", href: "/admin/produtos/novo" },
    { done: conn?.status === "conectado", label: "Conectar sua conta do Mercado Pago (é ela que recebe as vendas)", href: "/admin/pagamentos" },
    { done: (hours ?? []).length > 0, label: "Definir o horário de funcionamento", href: "/admin/horario" },
    { done: Boolean(store.name && store.slug), label: "Conferir o nome e o endereço da loja", href: "/admin/loja" },
  ];
  const pending = steps.filter((s) => !s.done);
  if (pending.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold text-ink">Primeiros passos</h2>
      <p className="mt-1 text-sm text-ink-soft">Faltam {pending.length} de {steps.length} para a loja estar pronta para vender.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span aria-hidden="true" className={`inline-block h-4 w-4 rounded-full border ${s.done ? "border-green-500 bg-green-500" : "border-line"}`} />
            {s.done ? <span className="text-ink-soft line-through">{s.label}</span> : <StoreLink href={s.href} className="font-medium text-navy hover:underline">{s.label}</StoreLink>}
          </li>
        ))}
      </ul>
    </section>
  );
}
