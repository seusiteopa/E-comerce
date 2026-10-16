import { MetadataRoute } from "next";
import { getRequestOrigin } from "@/lib/store/current";

export const dynamic = "force-dynamic"; // o endereço muda por loja

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getRequestOrigin();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Rotas administrativas e de conta nunca devem ser indexadas, mesmo
      // que hipoteticamente acessadas por um crawler sem sessão (o
      // middleware já bloqueia o acesso — isto é uma segunda camada,
      // a nível de intenção de indexação, não de segurança).
      { userAgent: "*", disallow: ["/admin", "/conta", "/checkout", "/api"] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
