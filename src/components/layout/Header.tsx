import Link from "next/link";
import Image from "next/image";
import { Search, User } from "lucide-react";
import Container from "@/components/ui/Container";
import MobileMenu from "@/components/layout/MobileMenu";
import CartIndicator from "@/components/layout/CartIndicator";
import { mainNav, siteConfig } from "@/data/site";

export default function Header({ logoUrl, siteName }: { logoUrl?: string; siteName?: string }) {
  const resolvedName = siteName?.trim() || siteConfig.storeName;

  return (
    <header className="border-b border-line bg-surface">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={resolvedName} width={64} height={36} priority className="h-9 w-auto object-contain" />
          ) : (
            <Image src="/brand/vecorion-icone-navy-transparente.png" alt={resolvedName} width={64} height={36} priority className="h-9 w-auto" />
          )}
          <span className="h-4 w-px bg-line" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-soft">{resolvedName}</span>
        </Link>

        <form action="/busca" className="hidden max-w-md flex-1 items-center gap-2 rounded-full border border-line px-4 py-2 lg:flex">
          <Search size={16} className="text-ink-soft shrink-0" aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="Buscar produtos..."
            aria-label="Buscar na loja"
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm font-medium text-ink-soft transition-colors hover:text-navy">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/conta/pedidos" aria-label="Minha conta" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-paper sm:flex">
            <User size={20} className="text-ink" aria-hidden="true" />
          </Link>
          <CartIndicator />
          <MobileMenu />
        </div>
      </Container>
      <span className="sr-only">{resolvedName}</span>
    </header>
  );
}
