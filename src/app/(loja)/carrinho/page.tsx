import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import CartItemList from "@/components/carrinho/CartItemList";
import CouponField from "@/components/carrinho/CouponField";
import CartSummaryClient from "@/components/carrinho/CartSummaryClient";

export const metadata: Metadata = { title: "Carrinho" };

export default function CarrinhoPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Carrinho</SectionEyebrow>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Seu carrinho</h1>

        <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <CartItemList />
            <CouponField />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummaryClient />
          </div>
        </div>
      </Container>
    </section>
  );
}
