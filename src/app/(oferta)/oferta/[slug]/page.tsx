import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductBySlug } from "@/lib/data/catalog";
import OfertaShowcase from "@/components/oferta/OfertaShowcase";

interface OfertaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OfertaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Oferta", robots: { index: false, follow: false } };

  const firstPhoto = [...(product.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .find((img) => img.media_type !== "video");

  return {
    title: product.name,
    description: product.short_description ?? undefined,
    robots: { index: false, follow: false },
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
      images: firstPhoto ? [{ url: firstPhoto.url, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.short_description ?? undefined,
      images: firstPhoto ? [firstPhoto.url] : undefined,
    },
  };
}

export default async function OfertaPage({ params }: OfertaPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.hidden) notFound();

  const price = Number(product.promo_price ?? product.price);
  const media = [...(product.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({ url: img.url, alt: img.alt_text, mediaType: (img.media_type as "imagem" | "video") ?? "imagem" }));

  return (
    <OfertaShowcase
      slug={product.slug}
      name={product.name}
      description={product.short_description ?? product.description ?? ""}
      price={price}
      media={media}
      isDigital={product.type === "digital"}
    />
  );
}
