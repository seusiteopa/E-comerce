import Link from "next/link";
import Container from "@/components/ui/Container";
import AccountNav from "@/components/conta/AccountNav";
import { requirePlatformAdmin } from "@/lib/platform";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function ContaSectionLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuthenticatedProfile();
  const isPlatformAdmin = await requirePlatformAdmin().then(() => true, () => false);
  // "Minhas compras" só aparece para quem já comprou em alguma loja (clientes finais precisam dos downloads).
  const { count } = await createSupabaseServiceClient().from("orders").select("id", { count: "exact", head: true }).eq("profile_id", profile.id);
  const firstName = (profile.full_name ?? "").trim().split(/\s+/)[0] || "";

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Link href="/conta" className="block overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-deep p-6 text-white shadow-sm sm:p-8">
          <p className="font-mono-label text-xs uppercase text-white/70">Minha conta</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{firstName ? `Olá, ${firstName}` : "Olá"}</h1>
          <p className="mt-1 text-sm text-white/80">Suas lojas, sites, imagens e vídeos num só lugar.</p>
        </Link>
        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[230px_1fr]">
          <AccountNav isPlatformAdmin={isPlatformAdmin} hasPurchases={(count ?? 0) > 0} />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </section>
  );
}
