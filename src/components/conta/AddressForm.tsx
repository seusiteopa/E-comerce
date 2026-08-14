"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createAddressAction } from "@/actions/enderecos";

export default function AddressForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAddressAction(formData);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field id="label" label="Rótulo (ex: Casa)" required={false} />
      <Field id="zipCode" label="CEP" />
      <Field id="street" label="Rua" className="sm:col-span-2" />
      <Field id="number" label="Número" />
      <Field id="complement" label="Complemento (opcional)" required={false} />
      <Field id="neighborhood" label="Bairro" />
      <Field id="city" label="Cidade" />
      <Field id="state" label="Estado (UF)" />
      {error && <p role="alert" className="text-sm text-status-danger sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={isPending} className="sm:col-span-2">
        {isPending ? "Salvando..." : "Salvar endereço"}
      </Button>
    </form>
  );
}

function Field({ id, label, className = "", required = true }: { id: string; label: string; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
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
