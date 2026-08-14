"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productSlug: string, variationId?: string) => void;
  updateQuantity: (productSlug: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Estado de carrinho vive em memória no navegador (React Context), sem
 * persistência em banco nesta etapa — front-end only, conforme escopo da
 * Etapa 8. A Etapa 9 pode manter esta mesma interface e trocar a
 * implementação interna para sincronizar com o backend, sem alterar quem
 * consome o contexto.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount }}
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
