"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import Button from "@/components/ui/Button";

/** Botão de compra direta de produto digital (1 unidade), exibido embaixo da galeria de imagens. */
export default function BuyNowButton({
  product,
}: {
  product: { id: string; slug: string; name: string; price: number; promoPrice?: number | null; images: { url: string }[] };
}) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <Button
      variant="primary"
      className="mt-4 h-12 w-full text-base font-semibold shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => {
        addItem({
          productId: product.id,
          productSlug: product.slug,
          name: product.name,
          type: "digital",
          variationId: undefined,
          variationLabel: undefined,
          quantity: 1,
          unitPrice: product.promoPrice ?? product.price,
          image: product.images[0]?.url ?? "/placeholder-product.svg",
        });
        router.push("/checkout");
      }}
    >
      Comprar agora
    </Button>
  );
}
