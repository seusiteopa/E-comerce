import "server-only";
import { requireAuthenticatedProfile, ForbiddenError } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ProfileRow } from "@/types/database";

/** Exige que a pessoa seja dona da plataforma (tabela platform_admins). */
export async function requirePlatformAdmin(): Promise<ProfileRow> {
  const profile = await requireAuthenticatedProfile();
  const service = createSupabaseServiceClient();
  const { data } = await service.from("platform_admins").select("user_id").eq("user_id", profile.id).maybeSingle();
  if (!data) throw new ForbiddenError();
  return profile;
}
