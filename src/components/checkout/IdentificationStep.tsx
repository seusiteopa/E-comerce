"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { loginAction, signUpAction } from "@/actions/auth";

export default function IdentificationStep({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(formData) : await signUpAction(formData);
      if (result.success) {
        onContinue();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex gap-1 rounded-full bg-paper p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          aria-pressed={mode === "login"}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-surface shadow-sm text-ink" : "text-ink-soft"}`}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          onClick={() => setMode("cadastro")}
          aria-pressed={mode === "cadastro"}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${mode === "cadastro" ? "bg-surface shadow-sm text-ink" : "text-ink-soft"}`}
        >
          Criar conta
        </button>
      </div>

      <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "cadastro" && (
          <Field id="fullName" label="Nome completo" type="text" autoComplete="name" />
        )}
        <Field id="email" label="E-mail" type="email" autoComplete="email" />
        <Field id="password" label="Senha" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />

        {error && (
          <p role="alert" className="text-sm text-status-danger">
            {error}
          </p>
        )}

        <p className="text-xs text-ink-soft">
          Você só precisa de uma conta para finalizar a compra — navegar e montar o carrinho não exige login.
        </p>

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? "Enviando..." : "Continuar"}
        </Button>
      </form>
    </div>
  );
}

function Field({ id, label, type, autoComplete }: { id: string; label: string; type: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-navy"
      />
    </div>
  );
}
