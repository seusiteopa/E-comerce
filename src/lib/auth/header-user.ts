import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Nome da pessoa logada para o cabeçalho (primeiro nome). Null quando ninguém está logado. */
export async function getHeaderUser(): Promise<{ firstName: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const full = profile?.full_name?.trim() || user.email?.split("@")[0] || "Minha conta";
  return { firstName: full.split(" ")[0] };
}
