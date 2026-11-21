import { useSearchParams } from 'react-router';
import { filtersToSearchParams, parseFilters, type ProductFilters } from './productFilters.ts';

type UpdateOptions = {
  /** replace: true edits the current history entry instead of adding one (used while typing). */
  replace?: boolean;
};

/**
 * Reads typed filters from the URL and writes changes back to it.
 * The URL is the single source of truth: there is no filter state anywhere else.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  // No useMemo here on purpose (D4-3): parsing five URL params takes microseconds,
  // and nothing downstream depends on the object's identity. See docs/performance.md.
  const filters = parseFilters(searchParams);

  function updateFilters(changes: Partial<ProductFilters>, { replace = false }: UpdateOptions = {}) {
    // Changing any filter jumps back to page 1: page 7 of the old results
    // probably doesn't exist in the new ones.
    const next: ProductFilters = { ...filters, page: 1, ...changes };
    setSearchParams(filtersToSearchParams(next), { replace });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  return { filters, updateFilters, clearFilters };
}
