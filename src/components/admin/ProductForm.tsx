"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createProductAction, updateProductAction, deleteProductImageAction } from "@/actions/admin/produtos";
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
}: {
  categories: CategoryRow[];
  product?: ProductRow;
  existingMedia?: ExistingMedia[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"fisico" | "digital" | "curso" | "servico">(product?.type ?? "fisico");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [media, setMedia] = useState(existingMedia);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(product);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="text-sm font-medium text-ink">Tipo</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "fisico" | "digital" | "curso" | "servico")}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="text-sm font-medium text-ink">Preço (R$)</label>
          <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
        <div>
          <label htmlFor="promoPrice" className="text-sm font-medium text-ink">Preço promocional (opcional)</label>
          <input id="promoPrice" name="promoPrice" type="number" step="0.01" min="0" defaultValue={product?.promo_price ?? ""} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy" />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
         <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-[#173F82]" />
          Produto em destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="hidden" defaultChecked={product?.hidden} className="h-4 w-4 accent-[#173F82]" />
          Produto exclusivo (link único, não aparece na loja)
        </label>
      </div>

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
          <label htmlFor="digitalFile" className="text-sm font-medium text-ink">
            Arquivo digital (ebook, PDF, ZIP...) {isEdit && "— enviar substitui o atual"}
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

      <div className="grid gap-4 sm:grid-cols-2">
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
        {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar produto"}
      </Button>

      {!isEdit && (
        <p className="text-xs text-ink-soft">
          Variações e vínculo de curso são adicionados depois de criar o produto (edição).
        </p>
      )}
    </form>
  );
}
