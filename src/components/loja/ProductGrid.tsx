import { Product } from "@/types";
import ProductCard from "@/components/loja/ProductCard";
import EmptyState from "@/components/ui/EmptyState";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto encontrado"
        description="Novos produtos são adicionados regularmente. Volte em breve ou explore outra categoria."
      />
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
