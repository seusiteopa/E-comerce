import { getCurrentStore } from "@/lib/store/current";
import { getStoreOpenStatus } from "@/lib/store/hours-data";
import DeliveryNotice from "@/components/loja/DeliveryNotice";

/** Aviso de funcionamento e região de atendimento, para a vitrine e o checkout. */
export default async function StoreStatusNotice() {
  const store = await getCurrentStore();
  const status = await getStoreOpenStatus(store.id);

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink" role="status">
        <span
          aria-hidden="true"
          className={`inline-block h-3 w-3 rounded-full ${status.open ? "bg-green-500" : "bg-red-500"}`}
        />
        {status.open
          ? "Aberto agora"
          : status.opensAt
            ? `Fechado agora. Abre hoje às ${status.opensAt}`
            : "Fechado agora"}
      </p>
      {!status.open && (
        <p className="text-xs text-ink-soft">Você pode navegar e montar o carrinho. O pedido só pode ser finalizado durante o horário de funcionamento.</p>
      )}
      <DeliveryNotice scope={store.delivery_scope} baseCity={store.delivery_base_city} cities={store.delivery_cities} />
    </div>
  );
}
