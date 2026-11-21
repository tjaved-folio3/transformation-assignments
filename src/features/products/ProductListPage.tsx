import { fetchProducts, toProductSearchParams } from '../../api/products.ts';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { formatCount } from '../../utils/format.ts';
import { FiltersBar } from './FiltersBar.tsx';
import { Pagination } from './Pagination.tsx';
import { PAGE_SIZE, filtersToQuery, hasActiveFilters } from './productFilters.ts';
import { ProductGrid } from './ProductGrid.tsx';
import { useProductFilters } from './useProductFilters.ts';

export function ProductListPage() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const query = filtersToQuery(filters);
  // The query string is the cache/identity key: same filters → same key.
  const key = `products?${toProductSearchParams(query).toString()}`;
  const state = useApiQuery(key, () => fetchProducts(query));

  return (
    <>
      <div className="page-header">
        <h1>Shop developer gear</h1>
        {state.status === 'success' && (
          <p className="result-count">
            {formatCount(state.data.total)} {state.data.total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      <FiltersBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        canClear={hasActiveFilters(filters)}
      />

      {state.status === 'loading' && <p>Loading products…</p>}
      {state.status === 'error' && <p>Something went wrong loading products.</p>}
      {state.status === 'success' && (
        <>
          <ProductGrid products={state.data.items} />
          <Pagination filters={filters} totalPages={Math.ceil(state.data.total / PAGE_SIZE)} />
        </>
      )}
    </>
  );
}
