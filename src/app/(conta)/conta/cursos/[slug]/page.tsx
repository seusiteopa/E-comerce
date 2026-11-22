import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Container from "@/components/ui/Container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCourseLessons } from "@/lib/curso/aulas-data";

export const metadata: Metadata = { title: "Meu curso", robots: { index: false, follow: false } };

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createSupabaseServiceClient();
  const { data: product } = await service.from("products").select("id, name, store_id").eq("slug", slug).maybeSingle();
  if (!product) notFound();

  // Só quem comprou o curso (pagamento aprovado) acessa as aulas.
  const { data: bought } = await service
    .from("order_items")
    .select("id, orders!inner(profile_id, payments(status))")
    .eq("product_id", product.id)
    .eq("orders.profile_id", user.id)
    .limit(20);
  const paid = (bought ?? []).some((row) => {
    const o = row.orders as unknown as { payments: { status: string }[] | null };
    return (o.payments ?? []).some((p) => p.status === "aprovado");
  });
  if (!paid) notFound();

  const lessons = await getCourseLessons(product.id);

  return (
    <section className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Meu curso</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{product.name}</h1>
        {lessons.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">As aulas ainda não foram publicadas. Volte mais tarde.</p>
        ) : (
          <ol className="mt-8 flex flex-col gap-8">
            {lessons.map((l, i) => (
              <li key={l.id} className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-ink">{i + 1}. {l.title}</h2>
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <iframe
                    src={l.video_url}
                    title={l.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </section>
  );
}
