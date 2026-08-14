"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import IdentificationStep from "@/components/checkout/IdentificationStep";
import AddressStep from "@/components/checkout/AddressStep";
import ShippingStep from "@/components/checkout/ShippingStep";
import PaymentStep from "@/components/checkout/PaymentStep";
import CartSummary from "@/components/carrinho/CartSummary";

type Step = "identificacao" | "endereco" | "frete" | "pagamento";

export default function CheckoutFlow() {
  const { items, subtotal } = useCart();
  const hasPhysicalItem = useMemo(() => items.some((i) => i.type === "fisico"), [items]);

  const [step, setStep] = useState<Step>("identificacao");
  const [addressId, setAddressId] = useState<string | undefined>();
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  const [shippingMethod, setShippingMethod] = useState<string | undefined>();

  const stepNumber = { identificacao: 1, endereco: 2, frete: 3, pagamento: 4 }[step];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <CheckoutStepper currentStep={stepNumber} />

        {step === "identificacao" && (
          <IdentificationStep onContinue={() => setStep(hasPhysicalItem ? "endereco" : "pagamento")} />
        )}

        {step === "endereco" && (
          <AddressStep
            onContinue={(newAddressId, zipCode) => {
              setAddressId(newAddressId);
              if (typeof window !== "undefined") sessionStorage.setItem("checkout_zip", zipCode);
              setStep("frete");
            }}
            onBack={() => setStep("identificacao")}
          />
        )}

        {step === "frete" && (
          <ShippingStep
            onContinue={(price, method) => {
              setShippingPrice(price);
              setShippingMethod(method);
              setStep("pagamento");
            }}
            onBack={() => setStep("endereco")}
          />
        )}

        {step === "pagamento" && (
          <PaymentStep
            onBack={() => setStep(hasPhysicalItem ? "frete" : "identificacao")}
            addressId={addressId}
            shippingMethod={shippingMethod}
          />
        )}

        {!hasPhysicalItem && (
          <p className="text-xs text-ink-soft">
            Seu pedido é 100% digital — não é necessário informar endereço ou calcular frete.
          </p>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <CartSummary subtotal={subtotal} shipping={hasPhysicalItem ? shippingPrice : 0} />
      </div>
    </div>
  );
}
