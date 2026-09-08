"use client";

import { useEffect, useRef, useState } from "react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";

/**
 * Junta a faixa institucional (sempre fixa, nunca some) e o cabeçalho
 * (esconde ao rolar pra baixo, aparece ao rolar pra cima) num único bloco
 * fixo no topo — e MEDE a altura real desse bloco de verdade (em vez de
 * "chutar" um número fixo em pixels), aplicando isso como uma variável CSS
 * que o restante da página usa pra saber quanto espaço reservar no topo.
 *
 * Isso evita de vez o bug de o cabeçalho cobrir o topo do conteúdo quando
 * a altura real dele muda (nome da loja mais longo, faixa institucional
 * quebrando linha em tela estreita, etc.) — o número nunca fica
 * desatualizado, porque é medido, não fixo no código.
 */
export default function SiteChrome({
  phrases,
  logoUrl,
  siteName,
}: {
  phrases: string[];
  logoUrl?: string;
  siteName?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasAnnouncementBar = phrases.length > 0;

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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    function updateHeight() {
      if (!el) return;
      // Mede sempre a altura "cheia" (faixa + cabeçalho), mesmo quando o
      // cabeçalho está escondido — é o espaço reservado no conteúdo,
      // então precisa ser o valor máximo possível, não o atual.
      const height = el.scrollHeight;
      document.documentElement.style.setProperty("--site-chrome-height", `${height}px`);
    }

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [phrases, logoUrl, siteName]);

  return (
    <div ref={wrapperRef} className="fixed inset-x-0 top-0 z-50">
      {hasAnnouncementBar && (
        <div className="flex h-8 items-center justify-center overflow-hidden bg-navy px-4 text-center">
          <AnnouncementBar phrases={phrases} />
        </div>
      )}
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
      >
        <Header logoUrl={logoUrl} siteName={siteName} />
      </div>
    </div>
  );
}
