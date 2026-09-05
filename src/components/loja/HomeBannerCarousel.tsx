"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  media_type: string;
}

export default function HomeBannerCarousel({ banners, variant }: { banners: Banner[]; variant: "principal" | "secundario" }) {
  const [index, setIndex] = useState(0);
  const active = banners[index];

  function goNext() {
    setIndex((i) => (i + 1) % banners.length);
  }

  useEffect(() => {
    if (banners.length <= 1) return;
    // Vídeo avança sozinho quando termina (onEnded, abaixo) — aqui só
    // controla o tempo de exibição das fotos, pra não cortar o vídeo no
    // meio independente da duração dele.
    if (active?.media_type === "video") return;
    const timer = setTimeout(goNext, 6000);
    return () => clearTimeout(timer);
  }, [index, banners.length, active?.media_type]);

  if (banners.length === 0) return null;

  const aspect = variant === "principal" ? "aspect-[21/9] sm:aspect-[21/7]" : "aspect-[21/9] sm:aspect-[3/1]";

  const media = (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-paper ${aspect}`}>
      {active.media_type === "video" ? (
        <video
          key={active.id}
          src={active.image_url}
          autoPlay
          muted
          playsInline
          loop={banners.length <= 1}
          onEnded={banners.length > 1 ? goNext : undefined}
          className="h-full w-full object-contain"
        />
      ) : (
        <Image key={active.id} src={active.image_url} alt={active.title ?? ""} fill className="object-contain" priority={variant === "principal"} />
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <span key={b.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );

  return active.link_url ? <Link href={active.link_url}>{media}</Link> : media;
}
