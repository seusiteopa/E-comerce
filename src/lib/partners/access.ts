import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ActivePartner = { id: string; name: string };

/** Agência logada e ativa, ou null. A agência só enxerga as lojas vinculadas a ela. */
export async function getActivePartner(): Promise<ActivePartner | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("partners")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .eq("status", "ativo")
    .maybeSingle();
  return data ?? null;
}
