import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";

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
  site_description?: string;
  whatsapp_number?: string;
  contact_email?: string;
  instagram_url?: string;
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
  const { id: storeId } = await getCurrentStore();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("store_id", storeId);

  const map: SiteSettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  // Dados da própria loja (cadastro) entram como padrão; contatos da Vecorion NUNCA vazam
  // para as outras lojas (vazio = a loja ainda não informou).
  const store = await getCurrentStore();
  map.site_name = map.site_name?.trim() || store.name;
  map.site_description = map.site_description?.trim() || store.description || undefined;
  map.logo_url = map.logo_url || store.logo_url || undefined;
  if (store.is_platform_owned) {
    map._platform = "1";
    map.whatsapp_number = map.whatsapp_number?.trim() || store.whatsapp || undefined;
  } else {
    map.whatsapp_number = map.whatsapp_number?.trim() || store.whatsapp || "";
    map.contact_email = map.contact_email?.trim() || "";
    map.instagram_url = map.instagram_url?.trim() || "";
  }
  return map;
}
