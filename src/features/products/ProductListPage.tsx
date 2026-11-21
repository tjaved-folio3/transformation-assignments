import { fetchProducts } from '../../api/products.ts';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { formatCount } from '../../utils/format.ts';
import { ProductGrid } from './ProductGrid.tsx';

export function ProductListPage() {
  const state = useApiQuery('products', () => fetchProducts({}));

  return (
    <>
      <div className="page-header">
        <h1>Shop developer gear</h1>
        {state.status === 'success' && <p>{formatCount(state.data.total)} products</p>}
      </div>
      {state.status === 'loading' && <p>Loading products…</p>}
      {state.status === 'error' && <p>Something went wrong loading products.</p>}
      {state.status === 'success' && <ProductGrid products={state.data.items} />}
    </>
  );
}
