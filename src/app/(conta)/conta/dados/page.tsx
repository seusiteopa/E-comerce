import { Metadata } from "next";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import DeleteAccountButton from "@/components/conta/DeleteAccountButton";
import Button from "@/components/ui/Button";

export const metadata: Metadata = { title: "Dados da Conta" };

export default async function DadosContaPage() {
  const profile = await requireAuthenticatedProfile();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dados da conta</h1>
        <dl className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Nome</dt>
            <dd className="text-ink">{profile.full_name || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Telefone</dt>
            <dd className="text-ink">{profile.phone || "—"}</dd>
          </div>
        </dl>
      </div>

      <form action={logoutAction}>
        <Button type="submit" variant="secondary">Sair da conta</Button>
      </form>

      <div className="rounded-2xl border border-status-danger/30 bg-status-danger-bg p-6">
        <h2 className="text-sm font-semibold text-status-danger">Excluir minha conta</h2>
        <p className="mt-2 text-xs text-ink-soft">
          Remove permanentemente seus dados pessoais e de acesso. Pedidos já realizados são mantidos
          para fins contábeis, sem vínculo com sua identidade. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
