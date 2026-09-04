"use client";

import { useRouter } from "next/navigation";
import ProductGallery from "@/components/loja/ProductGallery";

interface OfertaMedia {
  url: string;
  alt: string;
  mediaType: "imagem" | "video";
}

interface OfertaShowcaseProps {
  slug: string;
  name: string;
  description: string;
  price: number;
  media: OfertaMedia[];
  isDigital: boolean;
}

const priceFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Etapa 1 da oferta exclusiva: só a vitrine do produto (galeria, título,
 * descrição, preço) e um botão que leva pra etapa 2 (página de checkout
 * própria, em /oferta/[slug]/checkout) — igual à loja principal, onde
 * "ver o produto" e "finalizar a compra" são páginas separadas, em vez
 * de tudo espremido junto.
 */
export default function OfertaShowcase({ slug, name, description, price, media, isDigital }: OfertaShowcaseProps) {
  const router = useRouter();

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-10">
      {media.length > 0 && (
        <div className="mb-6">
          <ProductGallery media={media} productName={name} />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h1 className="text-xl font-bold leading-snug text-ink">{name}</h1>
        {description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{description}</p>}
        <p className="mt-4 text-3xl font-bold text-navy">{priceFormatter.format(price)}</p>

        <p className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
          {isDigital ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
              Produto digital — entrega imediata por link após o pagamento, sem frete.
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></svg>
              Frete calculado e combinado à parte após a confirmação do pagamento.
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/oferta/${slug}/checkout`)}
        className="mt-6 w-full rounded-xl bg-[#173F82] px-4 py-4 text-base font-semibold text-white"
      >
        Comprar agora — {priceFormatter.format(price)}
      </button>
    </div>
  );
}
