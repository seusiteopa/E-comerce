import StoreLink from "@/components/store/StoreLink";
import { Product } from "@/types";
import PriceTag from "@/components/ui/PriceTag";
import QuickBuyButtons from "@/components/loja/QuickBuyButtons";

import ProductImageSlider from "@/components/loja/ProductImageSlider";
export default function ProductCard({ product }: { product: Product }) {
  const outOfStock =
    product.type === "fisico" &&
    product.variations?.every((v) => v.stock === 0);

  return (
    <div className="flex h-full flex-col gap-2">
    <StoreLink
      href={`/produtos/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy/40 hover:shadow-xl"
    >
      <ProductImageSlider
        images={product.images.map((img) => ({ url: img.url, alt: img.alt }))}
        name={product.name}
        outOfStock={outOfStock}
      />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-xs text-ink-soft">{product.shortDescription}</p>
        <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
      </div>
    </StoreLink>
    <QuickBuyButtons product={product} />
    </div>
  );
}
