import { loadSalesByType } from "@/lib/plataforma/vendas";
import { formatCurrency } from "@/lib/format";

const LABEL: Record<string, string> = {
  loja: "Produtos físicos",
  digital: "Produtos virtuais",
  curso: "Cursos",
  restaurante: "Lanchonete ou restaurante",
  misto: "Mistas (antigas)",
};

/** Vendas aprovadas dos últimos 30 dias, por tipo de loja. */
export default async function VendasPorTipo() {
  const rows = await loadSalesByType();
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold text-ink">Vendas por tipo de loja (últimos 30 dias)</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Ainda não há vendas aprovadas neste período.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {rows.map((v) => (
            <li key={v.type} className="flex items-center justify-between gap-3 text-ink">
              <span>{LABEL[v.type] ?? v.type}</span>
              <span className="text-ink-soft">{v.count} venda(s) · {formatCurrency(v.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
