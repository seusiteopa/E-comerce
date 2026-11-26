"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSiteDeliveryAction } from "@/actions/plataforma/exclusoes";

export default function DeleteSiteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Excluir o site /sites/${slug}? O endereço deixa de funcionar.`)) return;
    startTransition(async () => {
      const result = await deleteSiteDeliveryAction(slug);
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
