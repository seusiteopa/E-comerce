import Container from "@/components/ui/Container";
import AccountNav from "@/components/conta/AccountNav";
import { requirePlatformAdmin } from "@/lib/platform";

export default async function ContaSectionLayout({ children }: { children: React.ReactNode }) {
  const isPlatformAdmin = await requirePlatformAdmin().then(() => true, () => false);
  return (
    <section className="py-16 sm:py-20">
      <Container className="grid min-w-0 gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav isPlatformAdmin={isPlatformAdmin} />
        <div>{children}</div>
      </Container>
    </section>
  );
}
