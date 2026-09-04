"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createProductAction, updateProductAction, deleteProductImageAction } from "@/actions/admin/produtos";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { uploadDigitalFileToCloudinary } from "@/lib/cloudinary-client";
import { CategoryRow, ProductRow } from "@/types/database";

interface ExistingMedia {
  id: string;
  url: string;
  media_type: string;
}

export default function ProductForm({
  categories,
  product,
  existingMedia = [],
  currentStock,
  currentDigitalFileUrl,
}: {
  categories: CategoryRow[];
  product?: ProductRow;
  existingMedia?: ExistingMedia[];
  currentStock?: number;
  currentDigitalFileUrl?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"fisico" | "digital">(product?.type ?? "fisico");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [media, setMedia] = useState(existingMedia);
  const [isPending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [hiddenChecked, setHiddenChecked] = useState(product?.hidden ?? false);
  const [linkCopied, setLinkCopied] = useState(false);
  const isEdit = Boolean(product);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        // Fotos/vídeo vão direto do navegador pro Cloudinary primeiro — o
        // arquivo em si nunca passa pela Function do servidor, só a URL
        // final. Evita o teto de tamanho de requisição do Netlify.
        const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
        const videoFile = formData.get("video");
        const folder = `vecorion/produtos/${product?.id ?? "novo"}`;

        formData.delete("photos");
        formData.delete("video");

        for (let i = 0; i < photoFiles.length; i++) {
          setUploadStatus(`Enviando foto ${i + 1} de ${photoFiles.length}...`);
          const url = await uploadFileToCloudinary(photoFiles[i], "image", folder);
          formData.append("photoUrls", url);
        }

        if (videoFile instanceof File && videoFile.size > 0) {
          setUploadStatus("Enviando vídeo...");
          const url = await uploadFileToCloudinary(videoFile, "video", folder);
          formData.append("videoUrl", url);
        }

        const digitalFile = formData.get("digitalFile");
        if (digitalFile instanceof File && digitalFile.size > 0) {
          setUploadStatus("Enviando arquivo digital...");
          const { url } = await uploadDigitalFileToCloudinary(digitalFile, `vecorion/produtos-digitais/${product?.id ?? "novo"}`);
          formData.delete("digitalFile");
          formData.append("digitalFileUrl", url);
        }
        setUploadStatus(null);
      } catch (err) {
        setUploadStatus(null);
        setError(`Não foi possível enviar a mídia: ${(err as Error).message}`);
        return;
      }

      const result = isEdit
        ? await updateProductAction(product!.id, formData)
        : await createProductAction(formData);
      if (result.success) {
        router.push("/admin/produtos");
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemoveMedia(imageId: string) {
    startTransition(async () => {
      const result = await deleteProductImageAction(imageId);
      if (result.success) {
        setMedia((current) => current.filter((m) => m.id !== imageId));
      }
    });
  }

  const filteredCategories = categories.filter((c) => c.product_type === type);

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Nome do produto</label>
        <input id="name" name="name" type="text" required defaultValue={product?.name} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="text-sm font-medium text-ink">Tipo</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "fisico" | "digital")}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          >
            <option value="fisico">Físico</option>
            <option value="digital">Digital</option>
          </select>
        </div>
        <div>
          <label htmlFor="categorySlug" className="text-sm font-medium text-ink">Categoria</label>
          {!creatingCategory ? (
            <>
              <select
                id="categorySlug"
                name="categorySlug"
                required={!creatingCategory}
                defaultValue={product?.category_slug ?? ""}
                className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
              >
                <option value="" disabled>Selecione...</option>
                {filteredCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="mt-2 text-xs font-semibold text-navy hover:underline"
              >
                + Criar nova categoria
              </button>
            </>
          ) : (
            <>
              <input
                id="newCategoryName"
                name="newCategoryName"
                type="text"
                required
                placeholder="Nome da nova categoria"
                className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => setCreatingCategory(false)}
                className="mt-2 text-xs font-semibold text-ink-soft hover:underline"
              >
                Usar categoria existente
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="shortDescription" className="text-sm font-medium text-ink">Descrição curta</label>
        <input id="shortDescription" name="shortDescription" type="text" maxLength={200} defaultValue={product?.short_description ?? ""} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">Descrição completa</label>
        <textarea id="description" name="description" required rows={4} defaultValue={product?.description ?? ""} className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="text-sm font-medium text-ink">Preço (R$)</label>
          <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
        <div>
          <label htmlFor="promoPrice" className="text-sm font-medium text-ink">Preço promocional (opcional)</label>
          <input id="promoPrice" name="promoPrice" type="number" step="0.01" min="0" defaultValue={product?.promo_price ?? ""} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
      </div>

      {type === "fisico" && (
        <div className="max-w-[220px]">
          <label htmlFor="stock" className="text-sm font-medium text-ink">Quantidade em estoque</label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={currentStock ?? 0}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy"
          />
          <p className="mt-1 text-xs text-ink-soft">Enquanto for 0, o produto aparece como esgotado na loja.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
         <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-[#173F82]" />
          Produto em destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="hidden"
            checked={hiddenChecked}
            onChange={(e) => setHiddenChecked(e.target.checked)}
            className="h-4 w-4 accent-[#173F82]"
          />
          Produto exclusivo (link único, não aparece na loja)
        </label>
      </div>

      {!isEdit && hiddenChecked && (
        <p className="text-xs text-ink-soft">O link da oferta aparece aqui pra copiar depois que você salvar o produto.</p>
      )}

      {isEdit && hiddenChecked && (
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">Link da oferta</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={`${process.env.NEXT_PUBLIC_SITE_URL}/oferta/${product!.slug}`}
              onFocus={(e) => e.target.select()}
              className="w-full truncate rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-soft outline-none"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/oferta/${product!.slug}`);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="shrink-0 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white"
            >
              {linkCopied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Esse é o único lugar onde esse produto aparece — compartilhe esse link direto com quem for comprar.</p>
        </div>
      )}

      <div>
        <label htmlFor="status" className="text-sm font-medium text-ink">Status</label>
        <select id="status" name="status" defaultValue={product?.status ?? "rascunho"} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy">
          <option value="rascunho">Rascunho</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {type === "digital" && (
        <div>
          {isEdit && currentDigitalFileUrl && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="shrink-0 text-status-success"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm text-ink">Já tem um arquivo ativo pra este produto.</span>
              </div>
              <a href={currentDigitalFileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-navy hover:underline">
                Abrir
              </a>
            </div>
          )}
          <label htmlFor="digitalFile" className="text-sm font-medium text-ink">
            Arquivo digital (ebook, PDF, ZIP...) {isEdit && currentDigitalFileUrl && "— enviar substitui o atual"}
          </label>
          <input
            id="digitalFile"
            name="digitalFile"
            type="file"
            accept=".pdf,.epub,.zip,.mp4,.mov,.doc,.docx"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Fica guardado de forma privada — o link de download só é liberado depois do pagamento aprovado.
          </p>
        </div>
      )}

      {isEdit && media.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink">Mídias atuais</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {media.map((item) => (
              <div key={item.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-line">
                {item.media_type === "video" ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(item.id)}
                  aria-label="Remover mídia"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="photos" className="text-sm font-medium text-ink">{isEdit ? "Adicionar mais fotos" : "Fotos do produto"}</label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <p className="mt-1 text-xs text-ink-soft">Pode selecionar várias fotos de uma vez. Sobem automaticamente pro Cloudinary.</p>
        </div>
        <div>
          <label htmlFor="video" className="text-sm font-medium text-ink">{isEdit ? "Adicionar vídeo" : "Vídeo do produto (opcional)"}</label>
          <input
            id="video"
            name="video"
            type="file"
            accept="video/*"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {uploadStatus ?? (isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar produto")}
      </Button>

      {!isEdit && (
        <p className="text-xs text-ink-soft">
          Variações são adicionadas depois de criar o produto (edição).
        </p>
      )}
    </form>
  );
}
