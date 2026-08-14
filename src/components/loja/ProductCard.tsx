import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { ProductTypeBadge } from "@/components/ui/Badge";
import PriceTag from "@/components/ui/PriceTag";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock =
    product.type === "fisico" &&
    product.variations?.every((v) => v.stock === 0);

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-navy/40"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        <Image
          src={product.images[0]?.url ?? "/placeholder-product.svg"}
          alt={product.images[0]?.alt ?? product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <ProductTypeBadge type={product.type} />
        <h3 className="text-sm font-semibold leading-snug text-ink">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-xs text-ink-soft">{product.shortDescription}</p>
        <PriceTag price={product.price} promoPrice={product.promoPrice} isQuoteOnly={product.isQuoteOnly} size="sm" />
      </div>
    </Link>
  );
}
