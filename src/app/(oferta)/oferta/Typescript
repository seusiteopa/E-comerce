import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductBySlug } from "@/lib/data/catalog";
import OfertaCheckout from "@/components/oferta/OfertaCheckout";

interface OfertaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OfertaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Oferta", robots: { index: false, follow: false } };
}

export default async function OfertaPage({ params }: OfertaPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.hidden) notFound();

  const price = Number(product.promo_price ?? product.price);
  const image = product.product_images?.[0]?.url ?? null;

  return (
    <OfertaCheckout
      slug={product.slug}
      name={product.name}
      description={product.short_description ?? product.description ?? ""}
      price={price}
      imageUrl={image}
    />
  );
}
