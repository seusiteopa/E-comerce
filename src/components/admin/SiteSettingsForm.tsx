"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { updateSiteSettingsAction } from "@/actions/admin/configuracoes";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { SiteSettingsMap } from "@/lib/data/site-settings";

export default function SiteSettingsForm({ settings }: { settings: SiteSettingsMap }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const logoFile = formData.get("logoFile");
        let logoUrl = settings.logo_url ?? "";
        if (logoFile instanceof File && logoFile.size > 0) {
          setUploadStatus("Enviando logo...");
          logoUrl = await uploadFileToCloudinary(logoFile, "image", "vecorion/marca");
        }
        setUploadStatus(null);

        const result = await updateSiteSettingsAction({
          site_name: (formData.get("site_name") as string)?.trim() ?? "",
          logo_url: logoUrl,
          announcement_phrase_1: (formData.get("announcement_phrase_1") as string)?.trim() ?? "",
          announcement_phrase_2: (formData.get("announcement_phrase_2") as string)?.trim() ?? "",
          announcement_phrase_3: (formData.get("announcement_phrase_3") as string)?.trim() ?? "",
        });

        if (result.success) {
          setSuccess(true);
          router.refresh();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setUploadStatus(null);
        setError(`Não foi possível enviar a logo: ${(err as Error).message}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6">
      <div>
        <h3 className="text-sm font-semibold text-ink">Identidade da loja</h3>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="site_name" className="text-sm font-medium text-ink">Nome da loja</label>
            <input
              id="site_name"
              name="site_name"
              type="text"
              defaultValue={settings.site_name ?? ""}
              placeholder="Vecorion"
              className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
            />
          </div>
          <div>
            <label htmlFor="logoFile" className="text-sm font-medium text-ink">Logo</label>
            {settings.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="Logo atual" className="mt-2 h-10 w-auto" />
            )}
            <input
              id="logoFile"
              name="logoFile"
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <p className="mt-1 text-xs text-ink-soft">Envie uma nova imagem pra substituir a logo atual do cabeçalho.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">Faixa institucional (topo do site)</h3>
        <p className="mt-1 text-xs text-ink-soft">Até 3 frases curtas que giram automaticamente acima do cabeçalho. Deixe em branco pra não mostrar a faixa.</p>
        <div className="mt-4 flex flex-col gap-3">
          <input
            name="announcement_phrase_1"
            type="text"
            defaultValue={settings.announcement_phrase_1 ?? ""}
            placeholder="Ex: Frete grátis acima de R$ 200"
            maxLength={120}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
          <input
            name="announcement_phrase_2"
            type="text"
            defaultValue={settings.announcement_phrase_2 ?? ""}
            placeholder="Ex: Entrega em todo o Brasil"
            maxLength={120}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
          <input
            name="announcement_phrase_3"
            type="text"
            defaultValue={settings.announcement_phrase_3 ?? ""}
            placeholder="Ex: Compra 100% segura"
            maxLength={120}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      {success && <p className="text-sm text-status-success">Configurações salvas.</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {uploadStatus ?? (isPending ? "Salvando..." : "Salvar configurações")}
      </Button>
    </form>
  );
}
