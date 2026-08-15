import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="conteudo-principal">{children}</main>
      <Footer />
    </>
  );
}
