import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Image as ImageIcon,
  MessageSquareText,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/orcamentos", label: "Orçamentos", icon: MessageSquareText },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex lg:h-screen lg:sticky lg:top-0">
      <div className="flex h-16 items-center gap-3 border-b border-line px-6">
        <Image src="/brand/vecorion-icone-navy-transparente.png" alt="Vecorion" width={36} height={19} className="h-5 w-auto" />
        <span className="text-sm font-semibold text-ink">Painel Admin</span>
      </div>
      <nav aria-label="Navegação do painel administrativo" className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
            >
              <Icon size={17} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="mt-auto border-t border-line p-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          <LogOut size={17} aria-hidden="true" />
          Sair da conta
        </button>
      </form>
    </aside>
  );
}
