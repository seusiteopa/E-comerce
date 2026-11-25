"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCouponActiveAction } from "@/actions/admin/cupons";

export default function ToggleCouponButton({ code, active }: { code: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCouponActiveAction(code, !active);
      if (result.success) router.refresh();
      else alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
    >
      {isPending ? "Salvando..." : active ? "Pausar" : "Reativar"}
    </button>
  );
}
