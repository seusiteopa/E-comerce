import { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Rotas administrativas e de conta nunca devem ser indexadas, mesmo
      // que hipoteticamente acessadas por um crawler sem sessão (o
      // middleware já bloqueia o acesso — isto é uma segunda camada,
      // a nível de intenção de indexação, não de segurança).
      { userAgent: "*", disallow: ["/admin", "/conta", "/checkout", "/api"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
