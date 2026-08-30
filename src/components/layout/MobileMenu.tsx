"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { mainNav } from "@/data/site";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Fecha ao tocar fora do menu (não só no X) — inclui um "backdrop"
  // invisível cobrindo o resto da tela, mais confiável no touch do que
  // só ouvir cliques no documento.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
      >
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-black/20" aria-hidden="true" />
          <nav
            ref={navRef}
            id="mobile-nav"
            aria-label="Navegação principal"
            className="absolute inset-x-0 top-full z-50 border-t border-line bg-surface px-5 py-6 shadow-lg"
          >
            <form action="/busca" className="mb-4 flex items-center gap-2 rounded-full border border-line px-4 py-2">
              <Search size={16} className="text-ink-soft" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Buscar produtos..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </form>
            <ul className="flex flex-col gap-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/conta/pedidos" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-paper">
                  Minha Conta
                </Link>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
