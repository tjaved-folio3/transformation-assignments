import { Link } from 'react-router';
import { filtersToSearchParams, type ProductFilters } from './productFilters.ts';

type PaginationProps = {
  filters: ProductFilters;
  totalPages: number;
};

/**
 * Real links (not buttons) so each page has its own URL: it can be opened in a
 * new tab, shared, and the Back button returns to the previous page.
 */
export function Pagination({ filters, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;
  const href = (page: number) => `?${filtersToSearchParams({ ...filters, page }).toString()}`;
  const { page } = filters;

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link className="button button--secondary" to={href(page - 1)} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className="button button--secondary" aria-disabled="true">
          ← Previous
        </span>
      )}
      <span className="pagination__status">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="button button--secondary" to={href(page + 1)} rel="next">
          Next →
        </Link>
      ) : (
        <span className="button button--secondary" aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
