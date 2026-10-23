import { getCurrentStore } from "@/lib/store/current";
import DeliveryNotice from "@/components/loja/DeliveryNotice";

/** Aviso de entrega da loja atual, para usar em qualquer página da vitrine e do checkout. */
export default async function StoreDeliveryNotice() {
  const store = await getCurrentStore();
  return <DeliveryNotice scope={store.delivery_scope} baseCity={store.delivery_base_city} cities={store.delivery_cities} />;
}
