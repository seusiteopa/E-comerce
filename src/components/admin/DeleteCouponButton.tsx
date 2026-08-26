"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCouponAction } from "@/actions/admin/cupons";

export default function DeleteCouponButton({ code }: { code: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Excluir o cupom "${code}"?`)) return;
    startTransition(async () => {
      const result = await deleteCouponAction(code);
      if (result.success) router.refresh();
      else alert(result.error);
    });
  }

  return (
    <button type="button" onClick={handleDelete} disabled={isPending} className="text-xs font-semibold text-status-danger hover:underline disabled:opacity-50">
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
