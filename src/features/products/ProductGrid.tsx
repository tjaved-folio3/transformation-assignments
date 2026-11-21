import type { Product } from '../../types/api.ts';
import { ProductCard } from './ProductCard.tsx';

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="product-grid">
      {products.map((product) => (
        // product.id is a stable, unique key: React can match cards between renders.
        <li key={product.id} className="product-card">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
