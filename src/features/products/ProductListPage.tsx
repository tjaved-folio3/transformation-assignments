import { Link } from 'react-router';
import { fetchProducts, toProductSearchParams } from '../../api/products.ts';
import { BackToTop } from '../../components/BackToTop.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusViews.tsx';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { formatCount } from '../../utils/format.ts';
import { FiltersBar } from './FiltersBar.tsx';
import { Pagination } from './Pagination.tsx';
import { PAGE_SIZE, filtersToQuery, filtersToSearchParams, hasActiveFilters } from './productFilters.ts';
import { ProductGrid } from './ProductGrid.tsx';
import { useProductFilters } from './useProductFilters.ts';

export function ProductListPage() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const query = filtersToQuery(filters);
  // The query string is the identity key: same filters → same key.
  const key = `products?${toProductSearchParams(query).toString()}`;
  const { state, refetch } = useApiQuery(key, (signal) => fetchProducts(query, signal));

  function renderResults() {
    switch (state.status) {
      case 'idle':
      case 'loading':
        return <LoadingState label="Loading products…" />;
      case 'error':
        return (
          <ErrorState
            title="We couldn't load the products"
            message="Something went wrong on our side. Please try again."
            onRetry={refetch}
          />
        );
      case 'success': {
        const { items, total } = state.data;
        const totalPages = Math.ceil(total / PAGE_SIZE);
        if (total === 0) {
          return (
            <EmptyState
              title="No products match"
              message="Try a different search, or clear the filters to see everything."
              action={
                <button type="button" className="button" onClick={clearFilters}>
                  Clear filters
                </button>
              }
            />
          );
        }
        if (items.length === 0) {
          return (
            <EmptyState
              title={`There is no page ${filters.page}`}
              message={`These results only go up to page ${totalPages}.`}
              action={
                <Link className="button" to={`?${filtersToSearchParams({ ...filters, page: 1 }).toString()}`}>
                  Go to page 1
                </Link>
              }
            />
          );
        }
        return (
          <>
            <ProductGrid products={items} />
            <Pagination filters={filters} totalPages={totalPages} />
          </>
        );
      }
    }
  }

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
      {renderResults()}
      <BackToTop />
    </>
  );
}
