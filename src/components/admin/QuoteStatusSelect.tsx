"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteRequestStatusAction } from "@/actions/admin/orcamentos";

const statusOptions = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "respondido", label: "Respondido" },
  { value: "encerrado", label: "Encerrado" },
];

export default function QuoteStatusSelect({ quoteRequestId, currentStatus }: { quoteRequestId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateQuoteRequestStatusAction({ quoteRequestId, status: e.target.value });
          router.refresh();
        });
      }}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink outline-none focus:border-navy"
    >
      {statusOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
