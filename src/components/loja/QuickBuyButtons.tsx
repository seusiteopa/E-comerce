"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useStoreBase, withStoreBase } from "@/components/store/StoreLink";
import StoreLink from "@/components/store/StoreLink";
import type { Product } from "@/types";

/** Botões de compra direto no cartão de produto (home e categorias). Produto com variação pede a escolha na página do produto. */
export default function QuickBuyButtons({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const base = useStoreBase();

  if ((product.variations?.length ?? 0) > 0) {
    return (
      <StoreLink
        href={`/produtos/${product.slug}`}
        className="mt-1 flex h-10 items-center justify-center rounded-full border border-line text-sm font-medium text-ink hover:bg-paper"
      >
        Escolher opções
      </StoreLink>
    );
  }

  const item = {
    productId: product.id,
    productSlug: product.slug,
    name: product.name,
    type: product.type,
    variationId: undefined,
    variationLabel: undefined,
    quantity: 1,
    unitPrice: product.promoPrice ?? product.price,
    image: product.images[0]?.url ?? "/placeholder-product.svg",
  };

  return (
    <div className="mt-1 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => addItem(item)}
        className="flex h-10 items-center justify-center rounded-full border border-line text-xs font-medium text-ink hover:bg-paper sm:text-sm"
      >
        Adicionar ao carrinho
      </button>
      <button
        type="button"
        onClick={() => {
          addItem(item);
          router.push(withStoreBase(base, "/carrinho"));
        }}
        className="flex h-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white hover:opacity-90 sm:text-sm"
      >
        Comprar
      </button>
    </div>
  );
}
