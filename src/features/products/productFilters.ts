import { CATEGORIES, SORT_OPTIONS, type Category, type ProductQuery, type SortOption } from '../../types/api.ts';

/**
 * Product filters live in the URL (?q=duck&category=ducks&inStock=true&sort=price-asc&page=2).
 * That single decision gives us three requirements for free:
 *   - refresh keeps the filters (the URL survives a reload)
 *   - a copied link reproduces the same view
 *   - the Back button steps through previous filter states (browser history)
 *
 * These pure functions convert between the URL and a typed object. Anything
 * invalid in the URL (?page=-3, ?category=hats) falls back to a default
 * instead of breaking the page.
 */

export const PAGE_SIZE = 24;

export type ProductFilters = {
  q: string;
  category: Category | null;
  inStock: boolean;
  sort: SortOption;
  page: number;
};

export const DEFAULT_FILTERS: ProductFilters = {
  q: '',
  category: null,
  inStock: false,
  sort: 'relevance',
  page: 1,
};

function parseCategory(value: string | null): Category | null {
  return CATEGORIES.find((category) => category === value) ?? null;
}

function parseSort(value: string | null): SortOption {
  return SORT_OPTIONS.find((option) => option === value) ?? 'relevance';
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function parseFilters(params: URLSearchParams): ProductFilters {
  return {
    q: (params.get('q') ?? '').slice(0, 100),
    category: parseCategory(params.get('category')),
    inStock: params.get('inStock') === 'true',
    sort: parseSort(params.get('sort')),
    page: parsePage(params.get('page')),
  };
}

/** Only non-default values go in the URL, so links stay short and readable. */
export function filtersToSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** Maps the UI filters to the API's query parameters. */
export function filtersToQuery(filters: ProductFilters): ProductQuery {
  return {
    search: filters.q.trim() || undefined,
    category: filters.category ?? undefined,
    inStock: filters.inStock || undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return filters.q.trim() !== '' || filters.category !== null || filters.inStock || filters.sort !== 'relevance';
}
