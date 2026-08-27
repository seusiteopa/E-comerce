"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryMedia {
  url: string;
  alt: string;
  mediaType: "imagem" | "video";
}

export default function ProductGallery({ media, productName }: { media: GalleryMedia[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
        {active.mediaType === "video" ? (
          <video
            key={active.url}
            src={active.url}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <Image
            key={active.url}
            src={active.url}
            alt={active.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-contain"
            priority={activeIndex === 0}
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver mídia ${index + 1} de ${media.length}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === activeIndex ? "border-navy" : "border-line"
              }`}
            >
              {item.mediaType === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <Image src={item.url} alt="" fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
