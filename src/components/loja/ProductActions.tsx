"use client";
import { findVariation } from "@/lib/produto/combinacoes";
import ProductOptionsPicker from "@/components/loja/ProductOptionsPicker";
import { checkSelection, type SelectableGroup } from "@/lib/produto/opcoes";

import { useStoreBase, withStoreBase } from "@/components/store/StoreLink";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Product } from "@/types";
import Button from "@/components/ui/Button";
import VariationPicker from "@/components/loja/VariationPicker";
import { useCart } from "@/lib/cart-context";

const ctaLabelByType: Record<Product["type"], string> = {
  fisico: "Adicionar ao carrinho",
  digital: "Comprar agora",
};

export default function ProductActions({ product, groups = [] }: { product: Product; groups?: SelectableGroup[] }) {
  const router = useRouter();
  const storeBase = useStoreBase();
  const { addItem } = useCart();
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    product.variations?.find((v) => v.stock > 0)?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [optionError, setOptionError] = useState<string | null>(null);
  const optionCheck = groups.length > 0 ? checkSelection(groups, selectedOptionIds) : { extra: 0, labels: [] as string[] };
  const optionsValid = !("error" in optionCheck);
  const optionExtra = "error" in optionCheck ? 0 : optionCheck.extra;
  const optionLabels = "error" in optionCheck ? [] : optionCheck.labels;

  // Grupos de escolha única definem a combinação (ex.: Cor × Tamanho), e cada combinação tem o seu estoque.
  const choiceGroups = groups.filter((g) => g.max_choices === 1);
  const hasChoiceGroups = choiceGroups.length > 0;
  const chosenAttrs: Record<string, string> = {};
  for (const g of choiceGroups) {
    const chosen = g.options.find((o) => selectedOptionIds.includes(o.id));
    if (chosen) chosenAttrs[g.name] = chosen.name;
  }
  const comboComplete = hasChoiceGroups && Object.keys(chosenAttrs).length === choiceGroups.length;
  const comboVariation = comboComplete && product.variations
    ? findVariation(product.variations.map((v) => ({ ...v, attributes: v.attributes as Record<string, string> })), chosenAttrs)
    : undefined;
  const selectedVariation = hasChoiceGroups
    ? comboVariation
    : product.variations?.find((v) => v.id === selectedVariationId);
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
      optionIds: selectedOptionIds.length > 0 ? [...selectedOptionIds].sort() : undefined,
      optionsLabel: optionLabels.length > 0 ? optionLabels.join(", ") : undefined,
      quantity,
      unitPrice: (product.promoPrice ?? product.price) + optionExtra,
      image: product.images[0]?.url ?? "/placeholder-product.svg",
    };
  }

  function ensureOptions(): boolean {
    if (!optionsValid) {
      setOptionError("error" in optionCheck ? optionCheck.error : null);
      return false;
    }
    setOptionError(null);
    return true;
  }

  function handleAction() {
    if (!ensureOptions()) return;
    addItem(buildCartItem());

    if (isPhysical) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      // Digital com preço fechado: vai direto para o checkout.
      router.push(withStoreBase(storeBase, "/carrinho"));
    }
  }

  function handleBuyNow() {
    if (!ensureOptions()) return;
    addItem(buildCartItem());
    router.push(withStoreBase(storeBase, "/carrinho"));
  }

  return (
    <div className="flex flex-col gap-5">
      {!hasChoiceGroups && product.variations && product.variations.length > 0 && (
        <VariationPicker
          variations={product.variations}
          selectedId={selectedVariationId}
          onSelect={setSelectedVariationId}
        />
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <ProductOptionsPicker groups={groups} selectedIds={selectedOptionIds} onChange={(ids) => { setSelectedOptionIds(ids); setOptionError(null); }} />
          {optionError && <p role="alert" className="text-xs text-status-danger">{optionError}</p>}
        </div>
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

      <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-row">
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

      {product.type === "digital" && (
        <p className="text-xs text-ink-soft">
          Após a confirmação do pagamento, o link de download fica disponível na sua conta.
        </p>
      )}
    </div>
  );
}
