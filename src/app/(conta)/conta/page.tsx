import type { Metadata } from "next";
import Link from "next/link";
import { Globe, ImageIcon, Store, Video } from "lucide-react";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };

export default async function ContaHomePage() {
  const profile = await requireAuthenticatedProfile();
  const service = createSupabaseServiceClient();
  const [lojas, briefs] = await Promise.all([
    service.from("store_members").select("store_id", { count: "exact", head: true }).eq("user_id", profile.id),
    service.from("service_briefs").select("kind").eq("user_id", profile.id),
  ]);
  const count = (kind: string) => (briefs.data ?? []).filter((b) => b.kind === kind).length;

  const cards = [
    { href: "/conta/lojas", label: "Minhas lojas", value: lojas.count ?? 0, icon: Store },
    { href: "/conta/sites", label: "Meus sites", value: count("site"), icon: Globe },
    { href: "/conta/imagens", label: "Minhas imagens", value: count("imagens"), icon: ImageIcon },
    { href: "/conta/videos", label: "Meus vídeos", value: count("videos"), icon: Video },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white"><Icon size={22} aria-hidden="true" /></span>
              <span>
                <span className="block font-mono-label text-xs uppercase text-ink-soft">{c.label}</span>
                <span className="block text-2xl font-semibold text-ink">{c.value}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-base font-semibold text-ink">Precisa de algo novo?</h2>
        <p className="mt-1 text-sm text-ink-soft">Conte o que você quer e acompanhe a entrega por aqui.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/criar-loja" className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Criar uma loja</Link>
          <Link href="/pedido?tipo=site" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper">Pedir um site</Link>
          <Link href="/pedido?tipo=imagens" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper">Pedir imagens</Link>
          <Link href="/pedido?tipo=videos" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper">Pedir um vídeo</Link>
        </div>
      </div>
    </div>
  );
}
