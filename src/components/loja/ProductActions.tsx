"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Product } from "@/types";
import Button from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/Button";
import VariationPicker from "@/components/loja/VariationPicker";
import { useCart } from "@/lib/cart-context";

const ctaLabelByType: Record<Product["type"], string> = {
  fisico: "Adicionar ao carrinho",
  digital: "Comprar agora",
  curso: "Comprar acesso ao curso",
  servico: "Contratar serviço",
};

export default function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    product.variations?.find((v) => v.stock > 0)?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Serviço sob orçamento: fluxo diferente (Etapa 3, regra de negócio da entidade quote_requests)
  if (product.isQuoteOnly) {
    return (
      <div className="flex flex-col gap-3">
        <LinkButton href={`/contato?assunto=orcamento&produto=${product.id}`} variant="primary">
          Solicitar orçamento
        </LinkButton>
        <p className="text-xs text-ink-soft">
          Este serviço é personalizado — o valor é definido após entendermos sua necessidade.
        </p>
      </div>
    );
  }

  const selectedVariation = product.variations?.find((v) => v.id === selectedVariationId);
  const isPhysical = product.type === "fisico";
  const isOutOfStock = isPhysical && (!selectedVariation || selectedVariation.stock === 0);

  function buildCartItem() {
    const variationLabel = selectedVariation
      ? Object.values(selectedVariation.attributes).join(" / ")
      : undefined;

    return {
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      type: product.type,
      variationId: selectedVariation?.id,
      variationLabel,
      quantity,
      unitPrice: product.promoPrice ?? product.price,
      image: product.images[0]?.url ?? "/placeholder-product.svg",
    };
  }

  function handleAction() {
    addItem(buildCartItem());

    if (isPhysical) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      // Digital/curso/serviço com preço fechado: vai direto para o checkout (Etapa 5, fluxo 3.2)
      router.push("/checkout");
    }
  }

  function handleBuyNow() {
    addItem(buildCartItem());
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-5">
      {product.variations && product.variations.length > 0 && (
        <VariationPicker
          variations={product.variations}
          selectedId={selectedVariationId}
          onSelect={setSelectedVariationId}
        />
      )}

      {isPhysical && (
        <div className="flex items-center gap-3">
          <span className="font-mono-label text-xs uppercase text-ink-soft">Quantidade</span>
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="flex h-9 w-9 items-center justify-center text-ink hover:bg-paper"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="flex h-9 w-9 items-center justify-center text-ink hover:bg-paper"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleAction} disabled={isOutOfStock} variant={isPhysical ? "secondary" : "primary"} className="w-full sm:w-auto">
          {justAdded ? (
            <>
              <Check size={16} aria-hidden="true" /> Adicionado ao carrinho
            </>
          ) : isOutOfStock ? (
            "Esgotado"
          ) : (
            ctaLabelByType[product.type]
          )}
        </Button>

        {isPhysical && (
          <Button onClick={handleBuyNow} disabled={isOutOfStock} variant="primary" className="w-full sm:w-auto">
            Comprar agora
          </Button>
        )}
      </div>

      {product.type === "curso" && (
        <p className="text-xs text-ink-soft">
          Após a confirmação do pagamento, o acesso é liberado na Vecorion Cursos.
        </p>
      )}
      {product.type === "digital" && (
        <p className="text-xs text-ink-soft">
          Após a confirmação do pagamento, o link de download fica disponível na sua conta.
        </p>
      )}
    </div>
  );
}
