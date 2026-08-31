/**
 * Sobrescreve as duas cores centrais do tema (--color-navy, usada em
 * links/contornos/CTAs secundários, e --color-farol, usada no botão
 * principal de compra) com o que o admin configurou. Sem elas, usa o
 * azul/laranja padrão da Vecorion.
 *
 * Como o resto do site inteiro é construído em cima dessas duas
 * variáveis (Tailwind `bg-navy`, `text-farol` etc. geram CSS que
 * referencia var(--color-navy) e var(--color-farol)), só essas duas
 * linhas já retemam boa parte da identidade visual de uma loja copiada
 * deste projeto para outro cliente — sem precisar mexer em nenhum
 * componente.
 */
export default function ThemeOverride({
  primaryColor,
  accentColor,
}: {
  primaryColor?: string;
  accentColor?: string;
}) {
  if (!primaryColor && !accentColor) return null;

  const declarations = [
    primaryColor ? `--color-navy: ${primaryColor};` : "",
    accentColor ? `--color-farol: ${accentColor};` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <style>{`:root { ${declarations} }`}</style>;
}
