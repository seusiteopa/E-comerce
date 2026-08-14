import { ReactNode } from "react";

export interface AdminColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Colunas marcadas como `primary` continuam visíveis no card mobile; as demais só aparecem em telas largas. */
  primary?: boolean;
}

export default function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  emptyLabel = "Nenhum registro encontrado.",
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">{emptyLabel}</p>;
  }

  return (
    <>
      {/* Tabela — telas médias/largas */}
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper">
              {columns.map((col) => (
                <th key={col.header} className="px-4 py-3 font-mono-label text-xs uppercase text-ink-soft">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-3 text-ink">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartões empilhados — mobile (Etapa 5: evita rolagem horizontal forçada) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-line bg-surface p-4">
            {columns
              .filter((c) => c.primary)
              .map((col) => (
                <div key={col.header} className="mb-2 last:mb-0">
                  <span className="font-mono-label block text-[10px] uppercase text-ink-soft">{col.header}</span>
                  <span className="text-sm text-ink">{col.cell(row)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
