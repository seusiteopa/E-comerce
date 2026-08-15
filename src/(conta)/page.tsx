"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { loginAction } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        router.push(searchParams.get("redirecionar") ?? "/conta/pedidos");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>
      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        Não tem conta? <Link href="/cadastro" className="font-semibold text-navy hover:underline">Criar conta</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-sm">
        <h1 className="text-3xl font-semibold text-ink">Entrar</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </Container>
    </section>
  );
}
