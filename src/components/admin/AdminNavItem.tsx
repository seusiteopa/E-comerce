"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import StoreLink, { useStoreBase, withStoreBase } from "@/components/store/StoreLink";

/** Item do menu do painel. Destaca a página atual (o endereço pode vir com o prefixo da loja). */
export default function AdminNavItem({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const base = useStoreBase();
  const full = withStoreBase(base, href);
  const active = href === "/admin" ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);

  return (
    <StoreLink
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-navy text-white shadow-sm"
          : "text-ink-soft hover:bg-paper hover:text-ink"
      }`}
    >
      <Icon size={17} aria-hidden="true" />
      {label}
    </StoreLink>
  );
}
