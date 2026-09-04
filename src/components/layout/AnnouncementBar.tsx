"use client";

import { useEffect, useState } from "react";

export const ANNOUNCEMENT_BAR_HEIGHT = 32;

export default function AnnouncementBar({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    // "Desliza rápido" — troca a cada 1,8s, como pedido.
    const timer = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 1800);
    return () => clearInterval(timer);
  }, [phrases.length]);

  if (phrases.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center overflow-hidden bg-navy px-4 text-center"
      style={{ height: ANNOUNCEMENT_BAR_HEIGHT }}
    >
      <p key={index} className="animate-[fadeSlide_0.4s_ease-out] text-xs font-medium text-white">
        {phrases[index]}
      </p>
    </div>
  );
}
