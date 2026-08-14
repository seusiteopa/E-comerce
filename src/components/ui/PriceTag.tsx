import { formatCurrency } from "@/lib/format";

export default function PriceTag({
  price,
  promoPrice,
  isQuoteOnly,
  size = "md",
}: {
  price: number;
  promoPrice?: number;
  isQuoteOnly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

  if (isQuoteOnly) {
    return <p className={`${sizeClass} font-semibold text-ink`}>Sob orçamento</p>;
  }

  if (promoPrice) {
    return (
      <div className="flex items-baseline gap-2">
        <p className={`${sizeClass} font-semibold text-navy`}>{formatCurrency(promoPrice)}</p>
        <p className="text-sm text-ink-soft line-through">{formatCurrency(price)}</p>
      </div>
    );
  }

  return <p className={`${sizeClass} font-semibold text-ink`}>{formatCurrency(price)}</p>;
}
