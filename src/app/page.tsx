"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { signUpAction } from "@/actions/auth";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-sm">
        <h1 className="text-3xl font-semibold text-ink">Criar conta</h1>

        {success ? (
          <p className="mt-8 text-sm text-status-success">
            Conta criada! Redirecionando para o login...
          </p>
        ) : (
          <form action={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-ink">Nome completo</label>
              <input id="fullName" name="fullName" type="text" required autoComplete="name" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">E-mail</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-ink">Senha</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
            </div>
            {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
            <Button type="submit" disabled={isPending} className="mt-2 w-full">
              {isPending ? "Criando..." : "Criar conta"}
            </Button>
            <p className="text-center text-sm text-ink-soft">
              Já tem conta? <Link href="/login" className="font-semibold text-navy hover:underline">Entrar</Link>
            </p>
          </form>
        )}
      </Container>
    </section>
  );
}
