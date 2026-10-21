"use client";

import { useState } from "react";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-optimizer";

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
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-paper shadow-sm">
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
            src={optimizeCloudinaryUrl(active.url, { width: 960, quality: "auto" })}
            alt={active.alt || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-contain"
            priority={activeIndex === 0}
            fetchPriority={activeIndex === 0 ? "high" : "auto"}
            unoptimized
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
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                index === activeIndex ? "border-farol ring-2 ring-farol/30" : "border-line hover:border-navy/40"
              }`}
            >
              {item.mediaType === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <Image src={optimizeCloudinaryUrl(item.url, { width: 160, height: 160, quality: "auto" })} alt="" fill sizes="64px" className="object-cover" unoptimized />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
