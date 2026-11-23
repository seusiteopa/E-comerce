"use client";

import { useState } from "react";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-optimizer";

/**
 * Fotos do cartão de produto com setas laterais discretas.
 * As setas só aparecem quando há mais de uma foto e não levam para a página do produto.
 */
export default function ProductImageSlider({
  images,
  name,
  outOfStock = false,
}: {
  images: { url: string; alt?: string | null }[];
  name: string;
  outOfStock?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[index] ?? null;

  function step(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  return (
    <div className="group/slider relative aspect-square w-full overflow-hidden bg-paper">
      <Image
        src={current ? optimizeCloudinaryUrl(current.url, { width: 400, height: 400, quality: "auto" }) : "/placeholder-product.svg"}
        alt={current?.alt ?? name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {count > 1 && (
        <>
          <span
            role="button"
            tabIndex={0}
            aria-label="Foto anterior"
            onClick={(e) => step(e, -1)}
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-base leading-none text-ink/70 opacity-60 backdrop-blur-[1px] transition hover:bg-white/50 hover:opacity-100"
          >
            ‹
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label="Próxima foto"
            onClick={(e) => step(e, 1)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-base leading-none text-ink/70 opacity-60 backdrop-blur-[1px] transition hover:bg-white/50 hover:opacity-100"
          >
            ›
          </span>
        </>
      )}
      {outOfStock && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">Esgotado</span>
      )}
    </div>
  );
}
