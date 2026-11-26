"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStoreAsPlatformAction } from "@/actions/plataforma/exclusoes";

export default function DeleteStorePanel({ storeId, slug, name }: { storeId: string; slug: string; name: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    if (!window.confirm(`Excluir a loja "${name}" e TODOS os dados dela (produtos, pedidos, categorias)? Não tem volta.`)) return;
    startTransition(async () => {
      const result = await deleteStoreAsPlatformAction(storeId, typed);
      if (result.success) router.push("/plataforma");
      else setError(result.error);
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-status-danger/40 bg-surface p-6">
      <h2 className="text-base font-semibold text-status-danger">Excluir esta loja</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Apaga a loja e tudo que ela tem: produtos, categorias, pedidos e configurações. Não precisa de pedido do lojista e não tem volta.
        Para confirmar, digite o endereço da loja: <strong>{slug}</strong>
      </p>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-label="Digite o endereço da loja para confirmar"
        placeholder={slug}
        className="mt-3 w-full max-w-sm rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-status-danger"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || typed.trim().toLowerCase() !== slug}
          className="rounded-full bg-status-danger px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isPending ? "Excluindo..." : "Excluir loja"}
        </button>
        {error && <span role="alert" className="text-xs text-status-danger">{error}</span>}
      </div>
    </section>
  );
}
