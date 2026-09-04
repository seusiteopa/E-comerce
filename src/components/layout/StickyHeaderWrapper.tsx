"use client";

import { useEffect, useRef, useState } from "react";
import { ANNOUNCEMENT_BAR_HEIGHT } from "@/components/layout/AnnouncementBar";

/**
 * A faixa institucional (acima) fica sempre fixa e visível — nunca some,
 * nem rolando pra cima. Já o cabeçalho principal, por baixo dela, some ao
 * rolar pra baixo (dá mais espaço de tela pro conteúdo) e reaparece assim
 * que rola pra cima de novo (acesso rápido ao menu/carrinho), sempre
 * colado logo abaixo da faixa.
 */
export default function StickyHeaderWrapper({
  children,
  hasAnnouncementBar,
}: {
  children: React.ReactNode;
  hasAnnouncementBar: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;
      const pastThreshold = currentY > 96;

      setHidden(scrollingDown && pastThreshold);
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const topOffset = hasAnnouncementBar ? ANNOUNCEMENT_BAR_HEIGHT : 0;

  return (
    <div
      className="fixed inset-x-0 z-50 transition-transform duration-300 ease-out"
      style={{ top: topOffset, transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      {children}
    </div>
  );
}
