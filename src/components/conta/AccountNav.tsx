"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, User, Globe, ImageIcon, Video, ShoppingBag, Shield } from "lucide-react";

const base = [
  { href: "/conta/lojas", label: "Minhas lojas", icon: Store },
  { href: "/conta/sites", label: "Meus sites", icon: Globe },
  { href: "/conta/imagens", label: "Minhas imagens", icon: ImageIcon },
  { href: "/conta/videos", label: "Meus vídeos", icon: Video },
  { href: "/conta/dados", label: "Dados da conta", icon: User },
];

export default function AccountNav({ isPlatformAdmin = false, hasPurchases = false }: { isPlatformAdmin?: boolean; hasPurchases?: boolean }) {
  const pathname = usePathname();
  const items = [
    ...base,
    ...(hasPurchases ? [{ href: "/conta/pedidos", label: "Minhas compras", icon: ShoppingBag }] : []),
    ...(isPlatformAdmin ? [{ href: "/plataforma", label: "Painel da plataforma", icon: Shield }] : []),
  ];

  return (
    <nav aria-label="Navegação da conta" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors lg:shrink ${
              active ? "bg-navy text-white shadow-sm" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
