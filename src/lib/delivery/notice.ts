/** Texto do aviso de entrega, usado na vitrine, no produto e no checkout. */
export function deliveryNoticeText(input: { scope: "local" | "brasil"; baseCity: string | null; cities: string[] }): string {
  if (input.scope === "brasil") return "Envio para todo o Brasil.";
  const city = input.baseCity?.trim() || "a região da loja";
  const others = input.cities.map((c) => c.trim()).filter(Boolean);
  return others.length > 0
    ? `Entrega somente em ${city} e região: ${others.join(", ")}.`
    : `Entrega somente em ${city} e região.`;
}
