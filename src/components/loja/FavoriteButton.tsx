"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/actions/favoritos";

/** Coração para guardar o produto nos favoritos da conta. */
export default function FavoriteButton({ productId, initialFavorited }: { productId: string; initialFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (result.success) setFavorited(result.data.favorited);
      else setMessage(result.error);
    });
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={favorited}
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50"
      >
        <Heart size={16} aria-hidden="true" className={favorited ? "fill-status-danger text-status-danger" : "text-ink-soft"} />
        {favorited ? "Nos favoritos" : "Favoritar"}
      </button>
      {message && <span role="alert" className="text-xs text-status-danger">{message}</span>}
    </div>
  );
}
