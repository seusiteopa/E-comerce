import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SiteSettingsMap {
  logo_url?: string;
  site_name?: string;
  announcement_phrase_1?: string;
  announcement_phrase_2?: string;
  announcement_phrase_3?: string;
  popup_coupon_code?: string;
  popup_coupon_message?: string;
  theme_primary_color?: string;
  theme_accent_color?: string;
  [key: string]: string | undefined;
}

/**
 * Lê todas as configurações do site (tabela site_settings, key/value) de
 * uma vez, num objeto único. Usado no cabeçalho, na faixa institucional e
 * na tela de configurações do admin — todos leem daqui pra nunca ficar
 * cada um com sua própria query.
 */
export async function getSiteSettings(): Promise<SiteSettingsMap> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const map: SiteSettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}
