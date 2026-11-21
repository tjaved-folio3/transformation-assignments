import { useState } from 'react';
import { CATEGORIES, SORT_OPTIONS, type Category, type SortOption } from '../../types/api.ts';
import type { ProductFilters } from './productFilters.ts';

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
  name: 'Name A–Z',
};

const CATEGORY_LABELS: Record<Category, string> = {
  keyboards: 'Keyboards',
  ducks: 'Rubber ducks',
  coffee: 'Coffee',
  stickers: 'Stickers',
};

type FiltersBarProps = {
  filters: ProductFilters;
  onChange: (changes: Partial<ProductFilters>, options?: { replace?: boolean }) => void;
  onClear: () => void;
  canClear: boolean;
};

export function FiltersBar({ filters, onChange, onClear, canClear }: FiltersBarProps) {
  // The search box keeps its own text so typing feels instant.
  const [text, setText] = useState(filters.q);
  // When the URL changes from OUTSIDE (Back button, "Clear filters"), copy the
  // new value into the box. This is React's "adjust state while rendering"
  // pattern: cheaper and safer than syncing with a useEffect.
  const [prevQ, setPrevQ] = useState(filters.q);
  if (filters.q !== prevQ) {
    setPrevQ(filters.q);
    setText(filters.q);
  }

  return (
    <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <div className="field filters__search">
        <label className="field__label" htmlFor="filter-search">
          Search
        </label>
        <input
          id="filter-search"
          className="input"
          type="search"
          placeholder="Try “duck” or “keyboard”"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            // replace: typing "duck" shouldn't create 4 history entries (d, du, duc, duck).
            onChange({ q: event.target.value }, { replace: true });
          }}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          className="select"
          value={filters.category ?? ''}
          onChange={(event) => {
            const category = CATEGORIES.find((item) => item === event.target.value) ?? null;
            onChange({ category });
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-sort">
          Sort by
        </label>
        <select
          id="filter-sort"
          className="select"
          value={filters.sort}
          onChange={(event) => {
            const sort = SORT_OPTIONS.find((option) => option === event.target.value) ?? 'relevance';
            onChange({ sort });
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <label className="checkbox filters__stock">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange({ inStock: event.target.checked })}
        />
        In stock only
      </label>

      <button type="button" className="button button--secondary filters__clear" onClick={onClear} disabled={!canClear}>
        Clear filters
      </button>
    </form>
  );
}
