import { deliveryNoticeText } from "@/lib/delivery/notice";

/** Aviso de onde a loja entrega. Aparece na vitrine, na página do produto e no checkout. */
export default function DeliveryNotice({ scope, baseCity, cities }: { scope: "local" | "brasil"; baseCity: string | null; cities: string[] }) {
  const local = scope === "local";
  return (
    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${local ? "bg-farol/15 text-navy" : "bg-status-success-bg text-status-success"}`}>
      {deliveryNoticeText({ scope, baseCity, cities })}
    </p>
  );
}
