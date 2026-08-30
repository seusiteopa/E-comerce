"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartAddedToast() {
  const { lastAddedItem } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAddedItem) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [lastAddedItem]);

  if (!lastAddedItem || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-opacity"
    >
      <Check size={16} className="shrink-0 text-status-success" aria-hidden="true" />
      <span className="max-w-[220px] truncate">{lastAddedItem.name}</span>
      <span className="text-white/70">adicionado ao carrinho</span>
    </div>
  );
}
