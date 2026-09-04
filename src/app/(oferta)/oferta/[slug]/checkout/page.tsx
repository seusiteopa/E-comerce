import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductBySlug } from "@/lib/data/catalog";
import OfertaPaymentForm from "@/components/oferta/OfertaPaymentForm";

interface OfertaCheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OfertaCheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product ? `Pagamento — ${product.name}` : "Pagamento", robots: { index: false, follow: false } };
}

export default async function OfertaCheckoutPage({ params }: OfertaCheckoutPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.hidden) notFound();

  const price = Number(product.promo_price ?? product.price);

  return <OfertaPaymentForm slug={product.slug} name={product.name} price={price} />;
}
