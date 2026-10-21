"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Entrada com Google para quem só quer comprar. Exige o provedor Google ativo no Supabase. */
export default function GoogleLoginButton({ next = "/conta/pedidos" }: { next?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
      }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-paper"
    >
      Entrar com Google
    </button>
  );
}
