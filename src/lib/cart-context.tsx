"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { CartItem } from "@/types";

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productSlug: string, variationId?: string) => void;
  updateQuantity: (productSlug: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  coupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  lastAddedItem: { name: string; at: number } | null;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Estado de carrinho vive em memória no navegador (React Context), sem
 * persistência em banco nesta etapa — front-end only, conforme escopo da
 * Etapa 8. A Etapa 9 pode manter esta mesma interface e trocar a
 * implementação interna para sincronizar com o backend, sem alterar quem
 * consome o contexto.
 *
 * O cupom aplicado também vive só aqui — é revalidado de verdade no
 * servidor no momento de criar o pedido (fonte de verdade nunca é o
 * cliente).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [lastAddedItem, setLastAddedItem] = useState<{ name: string; at: number } | null>(null);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productSlug === newItem.productSlug && i.variationId === newItem.variationId
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
    setLastAddedItem({ name: newItem.name, at: Date.now() });
  }

  function removeItem(productSlug: string, variationId?: string) {
    setItems((prev) =>
      prev.filter((i) => !(i.productSlug === productSlug && i.variationId === variationId))
    );
  }

  function updateQuantity(productSlug: string, quantity: number, variationId?: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.productSlug === productSlug && i.variationId === variationId
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    );
  }

  function clearCart() {
    setItems([]);
    setCoupon(null);
  }

  function applyCoupon(newCoupon: AppliedCoupon) {
    setCoupon(newCoupon);
  }

  function removeCoupon() {
    setCoupon(null);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        coupon,
        applyCoupon,
        removeCoupon,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de um CartProvider");
  return ctx;
}
