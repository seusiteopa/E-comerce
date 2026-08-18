"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Ticket,
  Image as ImageIcon,
  MessageSquareText,
  GraduationCap,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/orcamentos", label: "Orçamentos", icon: MessageSquareText },
  { href: "/admin/cursos-pendentes", label: "Cursos Pendentes", icon: GraduationCap },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-line bg-surface lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/vecorion-icone-navy-transparente.png"
            alt="Vecorion"
            width={32}
            height={17}
            className="h-4 w-auto"
          />
          <span className="text-sm font-semibold text-ink">Painel Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="rounded-lg p-2 text-ink hover:bg-paper"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav aria-label="Navegação do painel administrativo" className="flex flex-col gap-1 border-t border-line p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-navy/10 text-navy" : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-3 rounded-lg border-t border-line px-3 pt-4 text-sm font-medium text-ink-soft hover:text-ink"
          >
            Ver loja
          </Link>
        </nav>
      )}
    </div>
  );
}
