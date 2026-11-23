import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeOpenStatus, type HourRow, type OpenStatus } from "@/lib/store/hours";

export async function getStoreHours(storeId: string): Promise<HourRow[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("store_hours")
    .select("weekday, closed, opens_at, closes_at")
    .eq("store_id", storeId);
  return (data ?? []) as HourRow[];
}

export async function getStoreOpenStatus(storeId: string): Promise<OpenStatus> {
  return storeOpenStatus(await getStoreHours(storeId));
}
