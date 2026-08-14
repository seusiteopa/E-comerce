"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAddressAction } from "@/actions/enderecos";

export default function DeleteAddressButton({ addressId }: { addressId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await deleteAddressAction(addressId);
        router.refresh();
      })}
      aria-label="Remover endereço"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-status-danger"
    >
      <Trash2 size={16} aria-hidden="true" />
    </button>
  );
}
