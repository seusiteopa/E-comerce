export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
