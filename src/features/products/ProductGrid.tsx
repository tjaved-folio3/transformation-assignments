import { LiveStatus } from '../../components/LiveStatus.tsx';
import { useLiveStock } from '../../hooks/useLiveStock.ts';
import type { Product } from '../../types/api.ts';
import { ProductCard } from './ProductCard.tsx';

type ProductGridProps = {
  products: Product[];
};

/** One page of products (24). Subscribes to live stock for exactly these cards. */
export function ProductGrid({ products }: ProductGridProps) {
  const { stockById, status } = useLiveStock(products.map((product) => product.id));
  return (
    <>
      <LiveStatus status={status} />
      <ul className="product-grid">
        {products.map((product) => (
          // product.id is a stable, unique key: React can match cards between renders.
          <li key={product.id} className="product-card">
            <ProductCard product={product} stock={stockById[product.id] ?? product.stock} />
          </li>
        ))}
      </ul>
    </>
  );
}
