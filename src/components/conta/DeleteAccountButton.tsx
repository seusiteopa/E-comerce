"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { deleteAccountAction } from "@/actions/auth";

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
        Excluir minha conta
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-status-danger">Tem certeza? Esta ação é permanente.</span>
      <Button type="button" variant="secondary" onClick={() => setConfirming(false)} disabled={isPending}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="danger"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await deleteAccountAction();
        })}
      >
        {isPending ? "Excluindo..." : "Sim, excluir permanentemente"}
      </Button>
    </div>
  );
}
