import Link from "next/link";
import { Package, Download, Heart, MapPin, User } from "lucide-react";

const items = [
  { href: "/conta/pedidos", label: "Meus Pedidos", icon: Package },
  { href: "/conta/downloads", label: "Downloads", icon: Download },
  { href: "/conta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/conta/enderecos", label: "Endereços", icon: MapPin },
  { href: "/conta/dados", label: "Dados da Conta", icon: User },
];

export default function AccountNav() {
  return (
    <nav aria-label="Navegação da conta" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink lg:shrink"
          >
            <Icon size={17} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
