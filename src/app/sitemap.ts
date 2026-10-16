import { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore, getRequestOrigin } from "@/lib/store/current";

export const dynamic = "force-dynamic"; // depende de consulta ao banco, não pode ser force-static

const staticRoutes = ["", "/produtos", "/servicos", "/sobre", "/faq", "/contato"];

/**
 * Etapa 13: as páginas de catálogo/produto agora existem de verdade
 * (Etapa 8 fechada), então o sitemap deixa de listar só a Home (Etapa 12)
 * e passa a incluir produto e categoria dinamicamente, direto do banco —
 * mesmo princípio já usado no projeto Vecorion Cursos.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getRequestOrigin();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${origin}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const supabase = await createSupabaseServerClient();
    const { id: storeId } = await getCurrentStore();
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("store_id", storeId).eq("status", "ativo"),
      supabase.from("categories").select("slug").eq("store_id", storeId).eq("active", true),
    ]);

    const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${origin}/produtos/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
      url: `${origin}/categorias/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...productEntries, ...categoryEntries];
  } catch {
    // Se o banco estiver indisponível no momento da geração, o sitemap
    // ainda assim retorna as rotas estáticas — melhor um sitemap parcial
    // do que uma falha total de build/deploy.
    return staticEntries;
  }
}
