/** Regras das opções de produto (grupos e opções). Sem dependência de banco. */
export type OptionInput = { name: string; extra_price: number };
export type GroupInput = {
  name: string;
  mode: "escolha" | "multipla";
  required: boolean;
  min_choices: number;
  max_choices: number | null;
  options: OptionInput[];
};

/** Valida e normaliza os grupos. Devolve a mensagem do primeiro erro, ou null se estiver tudo certo. */
export function validateGroups(groups: GroupInput[]): string | null {
  if (groups.length > 20) return "Use no máximo 20 grupos por produto.";
  for (const g of groups) {
    if (!g.name.trim()) return "Todo grupo precisa de um nome.";
    if (g.options.length === 0) return `O grupo "${g.name}" precisa de pelo menos uma opção.`;
    if (g.options.some((o) => !o.name.trim())) return `Há uma opção sem nome no grupo "${g.name}".`;
    if (g.options.some((o) => !Number.isFinite(o.extra_price) || o.extra_price < 0)) {
      return `Valor extra inválido no grupo "${g.name}".`;
    }
    if (g.min_choices < 0) return `Mínimo inválido no grupo "${g.name}".`;
    if (g.max_choices !== null && g.max_choices < g.min_choices) {
      return `No grupo "${g.name}", o máximo não pode ser menor que o mínimo.`;
    }
    if (g.mode === "escolha" && g.max_choices !== null && g.max_choices > 1) {
      return `No grupo "${g.name}" (escolha única), o máximo é 1.`;
    }
    if (g.required && g.min_choices < 1) return `No grupo obrigatório "${g.name}", o mínimo é 1.`;
  }
  return null;
}

/** Escolha única usa máximo 1; múltipla sem limite usa null. */
export function normalizeGroup(g: GroupInput): GroupInput {
  if (g.mode === "escolha") {
    return { ...g, max_choices: 1, min_choices: g.required ? 1 : 0 };
  }
  return { ...g, min_choices: g.required ? Math.max(1, g.min_choices) : g.min_choices };
}

export type SelectableGroup = { id: string; name: string; required: boolean; min_choices: number; max_choices: number | null; options: { id: string; name: string; extra_price: number }[] };

/** Confere as escolhas do cliente contra os grupos do produto. Devolve erro ou o valor extra total e os nomes escolhidos. */
export function checkSelection(groups: SelectableGroup[], selectedIds: string[]): { error: string } | { extra: number; labels: string[] } {
  const all = new Map<string, { group: SelectableGroup; option: { id: string; name: string; extra_price: number } }>();
  for (const g of groups) for (const o of g.options) all.set(o.id, { group: g, option: o });
  for (const id of selectedIds) if (!all.has(id)) return { error: "Uma das opções escolhidas não existe mais. Atualize a página." };

  let extra = 0;
  const labels: string[] = [];
  for (const g of groups) {
    const chosen = g.options.filter((o) => selectedIds.includes(o.id));
    const min = g.required ? Math.max(1, g.min_choices) : g.min_choices;
    if (chosen.length < min) return { error: `Escolha ao menos ${min} opção em "${g.name}".` };
    if (g.max_choices !== null && chosen.length > g.max_choices) return { error: `Em "${g.name}", o máximo é ${g.max_choices}.` };
    for (const o of chosen) {
      extra += o.extra_price;
      labels.push(o.name);
    }
  }
  return { extra, labels };
}
