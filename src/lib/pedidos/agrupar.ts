/** Organiza os itens de um pedido por tipo de produto, para mostrar em seções separadas. */
export type OrderLine = { name: string; quantity: number; unitPrice: number; type: string; slug?: string };
export type OrderSection = { key: "fisico" | "digital" | "curso"; label: string; lines: OrderLine[] };

const ORDER: OrderSection["key"][] = ["fisico", "digital", "curso"];
const LABEL: Record<OrderSection["key"], string> = {
  fisico: "Produtos físicos",
  digital: "Produtos digitais",
  curso: "Cursos",
};

/** Seções só com os tipos que existem no pedido, na ordem fixa: físicos, digitais, cursos. */
export function groupOrderLines(lines: OrderLine[]): OrderSection[] {
  return ORDER.map((key) => ({
    key,
    label: LABEL[key],
    lines: lines.filter((l) => l.type === key),
  })).filter((s) => s.lines.length > 0);
}
