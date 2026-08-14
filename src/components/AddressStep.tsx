"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { createAddressAction } from "@/actions/enderecos";

export default function AddressStep({
  onContinue,
  onBack,
}: {
  onContinue: (addressId: string, zipCode: string) => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const zipCode = String(formData.get("zipCode") ?? "");
    startTransition(async () => {
      const result = await createAddressAction(formData);
      if (result.success) {
        onContinue(result.data.addressId, zipCode);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Endereço de entrega</h2>
      <form action={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="zipCode" label="CEP" className="sm:col-span-1" />
        <div className="sm:col-span-1" />
        <Field id="street" label="Rua" className="sm:col-span-2" />
        <Field id="number" label="Número" />
        <Field id="complement" label="Complemento (opcional)" required={false} />
        <Field id="neighborhood" label="Bairro" />
        <Field id="city" label="Cidade" />
        <Field id="state" label="Estado (UF)" className="sm:col-span-2" />

        {error && (
          <p role="alert" className="text-sm text-status-danger sm:col-span-2">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-3 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onBack} disabled={isPending}>
            Voltar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Salvando..." : "Continuar para o frete"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  className = "",
  required = true,
}: {
  id: string;
  label: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-navy"
      />
    </div>
  );
}
