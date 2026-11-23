import { getCurrentStore } from "@/lib/store/current";
import { getStoreOpenStatus } from "@/lib/store/hours-data";

/** Aviso no carrinho quando a loja está fechada: o cliente pode montar o pedido, mas não finalizar agora. */
export default async function StoreClosedNotice() {
  const store = await getCurrentStore();
  const status = await getStoreOpenStatus(store.id);
  if (status.open) return null;
  return (
    <div role="status" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-ink">
      <p className="font-semibold">A loja está fechada agora.</p>
      <p className="mt-1 text-ink-soft">
        {status.opensAt ? `Ela abre hoje às ${status.opensAt}. ` : ""}Você pode montar o carrinho, mas só consegue finalizar o pedido durante o horário de funcionamento.
      </p>
    </div>
  );
}
