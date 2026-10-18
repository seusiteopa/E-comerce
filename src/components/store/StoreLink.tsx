"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";

/** Prefixo da loja atual (ex.: "/lojas/bom-trigo") ou "" quando a vitrine é o endereço padrão. */
const StoreBaseContext = createContext("");

export function StoreBaseProvider({ value, children }: { value: string; children: ReactNode }) {
  return <StoreBaseContext.Provider value={value}>{children}</StoreBaseContext.Provider>;
}

/** Áreas que nunca recebem o prefixo da loja (são da plataforma ou de rotas fora da vitrine). */
const UNPREFIXED = ["/conta", "/login", "/cadastro", "/plataforma", "/criar-loja", "/api", "/offline"];

/** Prefixo da loja atual, para navegação feita por código (router.push). */
export function useStoreBase(): string {
  return useContext(StoreBaseContext);
}

export function withStoreBase(base: string, href: string): string {
  if (!base || !href.startsWith("/") || href.startsWith("//")) return href;
  if (UNPREFIXED.some((p) => href === p || href.startsWith(p + "/") || href.startsWith(p + "?"))) return href;
  return href === "/" ? base : `${base}${href}`;
}

type StoreLinkProps = React.ComponentProps<typeof Link>;

/** Link que mantém a loja atual na navegação da vitrine. */
export default function StoreLink({ href, ...rest }: StoreLinkProps) {
  const base = useContext(StoreBaseContext);
  const finalHref = typeof href === "string" ? withStoreBase(base, href) : href;
  return <Link href={finalHref} {...rest} />;
}
