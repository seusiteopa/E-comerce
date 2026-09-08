"use client";

import { useEffect, useState } from "react";

/**
 * Só o conteúdo da faixa (frases girando) — a posição fixa e a medição de
 * altura ficam em SiteChrome.tsx, que envolve este componente.
 */
export default function AnnouncementBar({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 1800);
    return () => clearInterval(timer);
  }, [phrases.length]);

  if (phrases.length === 0) return null;

  return (
    <p key={index} className="animate-[fadeSlide_0.4s_ease-out] text-xs font-medium text-white">
      {phrases[index]}
    </p>
  );
}
