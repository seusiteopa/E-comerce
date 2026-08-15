import { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionEyebrow>Checkout</SectionEyebrow>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Finalizar compra</h1>

        <div className="mt-10">
          <CheckoutFlow />
        </div>
      </Container>
    </section>
  );
}
