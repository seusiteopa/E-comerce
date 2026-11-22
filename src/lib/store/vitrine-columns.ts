import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type VitrineColumns = "1" | "2" | "3";

/** Colunas da vitrine escolhidas pelo lojista (padrão: 2). */
export async function getVitrineColumns(storeId: string): Promise<VitrineColumns> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("site_settings")
    .select("value")
    .eq("store_id", storeId)
    .eq("key", "vitrine_colunas")
    .maybeSingle();
  return data?.value === "1" || data?.value === "3" ? data.value : "2";
}
