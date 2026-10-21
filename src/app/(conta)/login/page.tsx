"use client";

import { PasswordField } from "@/components/ui/PasswordField";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { loginAction, resendConfirmationAction } from "@/actions/auth";
import { EMAIL_NOT_CONFIRMED_MSG } from "@/lib/auth-messages";


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setResendStatus(null);
    setPendingEmail(String(formData.get("email") ?? ""));
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        const explicitRedirect = searchParams.get("redirecionar");
        if (explicitRedirect) {
          router.push(explicitRedirect);
        } else if (result.data.isAdmin) {
          router.push("/admin");  // sem destino salvo: painel da loja principal
        } else {
          router.push("/conta/pedidos");
        }
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4">
      </div>
    <form action={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">Senha</label>
        <PasswordField id="password" name="password" autoComplete="current-password" required />
      </div>
      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      {error === EMAIL_NOT_CONFIRMED_MSG && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              const result = await resendConfirmationAction(pendingEmail);
              setResendStatus(result.success ? "Enviamos um novo e-mail de confirmação." : result.error);
            }}
            className="text-left text-sm font-semibold text-navy hover:underline"
          >
            Reenviar e-mail de confirmação
          </button>
          {resendStatus && <p className="text-sm text-ink-soft">{resendStatus}</p>}
        </div>
      )}
      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        Não tem conta? <Link href="/cadastro" className="font-semibold text-navy hover:underline">Criar conta</Link>
      </p>
    </form>
    </>
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
