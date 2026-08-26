"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createBannerAction } from "@/actions/admin/banners";

export default function BannerForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBannerAction(formData);
      if (result.success) {
        router.refresh();
        const form = document.getElementById("banner-form") as HTMLFormElement | null;
        form?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form id="banner-form" action={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="photos" className="text-sm font-medium text-ink">Fotos do banner (até 3)</label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        <p className="mt-1 text-xs font-medium text-navy">
          Dimensão recomendada: 2100 × 700px (proporção 21:7). Sobem automaticamente pro Cloudinary. Mais de uma foto = giram em carrossel.
        </p>
      </div>

      <div>
        <label htmlFor="video" className="text-sm font-medium text-ink">Vídeo do banner (opcional, no máximo 1)</label>
        <input
          id="video"
          name="video"
          type="file"
          accept="video/*"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        <p className="mt-1 text-xs text-ink-soft">Mesma proporção 21:7 recomendada, até 30 segundos.</p>
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium text-ink">Título (opcional, uso interno)</label>
        <input id="title" name="title" type="text" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div>
        <label htmlFor="linkUrl" className="text-sm font-medium text-ink">Link ao clicar (opcional)</label>
        <input
          id="linkUrl"
          name="linkUrl"
          type="text"
          placeholder="/produtos/nome-do-produto"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
        />
      </div>

      <div>
        <label htmlFor="position" className="text-sm font-medium text-ink">Posição</label>
        <select id="position" name="position" defaultValue="principal" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy">
          <option value="principal">Principal (topo da home)</option>
          <option value="secundario">Secundário</option>
        </select>
        <p className="mt-1 text-xs text-ink-soft">Pode ter um banner "Principal" e um "Secundário" ativos ao mesmo tempo, em posições diferentes da home.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-[#173F82]" />
        Ativo
      </label>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando mídias..." : "Adicionar banner"}
      </Button>
    </form>
  );
}
