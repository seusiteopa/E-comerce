"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { mainNav } from "@/data/site";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

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
        <nav
          id="mobile-nav"
          aria-label="Navegação principal"
          className="absolute inset-x-0 top-full border-t border-line bg-surface px-5 py-6 shadow-lg"
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
      )}
    </div>
  );
}
