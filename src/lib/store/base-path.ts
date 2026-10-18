import "server-only";
import { headers } from "next/headers";

/** Prefixo da loja na rota /lojas/<loja>/..., definido pelo proxy. "" quando não há rota de loja. */
export async function storeBasePath(): Promise<string> {
  const slug = (await headers()).get("x-store-slug");
  return slug ? `/lojas/${slug}` : "";
}
