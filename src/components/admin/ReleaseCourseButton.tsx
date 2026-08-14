"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { markCourseAccessReleasedAction } from "@/actions/admin/pedidos";

export default function ReleaseCourseButton({ orderItemId }: { orderItemId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await markCourseAccessReleasedAction(orderItemId);
        router.refresh();
      })}
      className="px-4 py-2 text-xs"
    >
      {isPending ? "Liberando..." : "Marcar como liberado"}
    </Button>
  );
}
