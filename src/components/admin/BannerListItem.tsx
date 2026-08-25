"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBannerActiveAction, deleteBannerAction } from "@/actions/admin/banners";

interface BannerListItemProps {
  banner: {
    id: string;
    title: string | null;
    image_url: string;
    link_url: string | null;
    position: string;
    active: boolean;
  };
}

export default function BannerListItem({ banner }: BannerListItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleBannerActiveAction(banner.id, !banner.active);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Excluir este banner?")) return;
    startTransition(async () => {
      await deleteBannerAction(banner.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-3">
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-paper">
        <Image src={banner.image_url} alt={banner.title ?? ""} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{banner.title ?? "Sem título"}</p>
        <p className="text-xs text-ink-soft">
          {banner.position === "principal" ? "Principal" : "Secundário"} · {banner.active ? "Ativo" : "Inativo"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="whitespace-nowrap rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-paper"
      >
        {banner.active ? "Desativar" : "Ativar"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="whitespace-nowrap rounded-lg border border-status-danger/30 px-3 py-2 text-xs font-medium text-status-danger hover:bg-status-danger-bg"
      >
        Excluir
      </button>
    </div>
  );
}
