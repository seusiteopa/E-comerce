import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";
import AddressForm from "@/components/conta/AddressForm";
import DeleteAddressButton from "@/components/conta/DeleteAddressButton";

export const metadata: Metadata = { title: "Endereços" };

export default async function EnderecosPage() {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Endereços</h1>
        {addresses && addresses.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-3">
            {addresses.map((address) => (
              <li key={address.id} className="flex items-start justify-between rounded-xl border border-line bg-surface p-4">
                <div className="text-sm text-ink">
                  <p className="font-semibold">{address.label}</p>
                  <p className="text-ink-soft">
                    {address.street}, {address.number} {address.complement && `— ${address.complement}`}
                  </p>
                  <p className="text-ink-soft">{address.neighborhood}, {address.city}/{address.state} — {address.zip_code}</p>
                </div>
                <DeleteAddressButton addressId={address.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Nenhum endereço cadastrado ainda.</p>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Adicionar novo endereço</h2>
        <AddressForm />
      </div>
    </div>
  );
}
