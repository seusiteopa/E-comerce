import Container from "@/components/ui/Container";
import AccountNav from "@/components/conta/AccountNav";

export default function ContaSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="grid min-w-0 gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </Container>
    </section>
  );
}
