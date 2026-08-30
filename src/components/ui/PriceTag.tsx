import { formatCurrency } from "@/lib/format";

export default function PriceTag({
  price,
  promoPrice,
  size = "md",
}: {
  price: number;
  promoPrice?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

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
