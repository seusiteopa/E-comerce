"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
};

/** Campo de senha com botão para mostrar/ocultar o que foi digitado. */
export function PasswordField({ id, name, autoComplete, required, minLength }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 pr-20 text-sm outline-none focus:border-navy"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-navy"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
