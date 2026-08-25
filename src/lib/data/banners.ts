import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BannerRow {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  position: string;
  display_order: number;
}

/** Busca banners ativos de uma posição, respeitando janela de vigência (starts_at/ends_at). */
export async function getActiveBanners(position: string): Promise<BannerRow[]> {
  const supabase = await createSupabaseServerClient();
  const now = Date.now();

  const { data, error } = await supabase
    .from("banners")
    .select("id, image_url, link_url, title, position, display_order, starts_at, ends_at")
    .eq("position", position)
    .eq("active", true)
    .order("display_order");

  if (error || !data) return [];

  return data.filter((b) => {
    const startsOk = !b.starts_at || new Date(b.starts_at).getTime() <= now;
    const endsOk = !b.ends_at || new Date(b.ends_at).getTime() >= now;
    return startsOk && endsOk;
  }) as BannerRow[];
}
