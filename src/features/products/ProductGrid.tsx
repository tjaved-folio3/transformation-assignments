import type { Product } from '../../types/api.ts';
import { ProductCard } from './ProductCard.tsx';

type ProductGridProps = {
  products: Product[];
  /** Live stock pushed over the WebSocket, by product id. */
  stockById?: Record<string, number>;
};

export function ProductGrid({ products, stockById = {} }: ProductGridProps) {
  return (
    <ul className="product-grid">
      {products.map((product) => (
        // product.id is a stable, unique key: React can match cards between renders.
        <li key={product.id} className="product-card">
          <ProductCard product={product} stock={stockById[product.id] ?? product.stock} />
        </li>
      ))}
    </ul>
  );
}
