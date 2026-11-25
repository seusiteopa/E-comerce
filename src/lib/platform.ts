import "server-only";
import { redirect } from "next/navigation";
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

/**
 * Trava para as PÁGINAS da plataforma: só o dono entra. Quem não é dono volta para o início,
 * sem ver nenhum dado. Cada página chama isto logo na primeira linha, porque o layout não roda
 * de novo quando a pessoa navega entre telas.
 */
export async function requirePlatformPage(): Promise<ProfileRow> {
  let profile: ProfileRow | null = null;
  try {
    profile = await requirePlatformAdmin();
  } catch (err) {
    // Sinal interno do Next (renderização dinâmica) não é recusa de acesso: repassa.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: unknown }).digest).includes("DYNAMIC")) throw err;
  }
  if (!profile) redirect("/");
  return profile;
}
