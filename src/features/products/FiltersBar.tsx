import { useEffect, useEffectEvent, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { CATEGORIES, SORT_OPTIONS, type Category, type SortOption } from '../../types/api.ts';
import type { ProductFilters } from './productFilters.ts';

/** How long typing must pause before we search. */
const SEARCH_DEBOUNCE_MS = 300;

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
  // The search box keeps its own text so typing feels instant…
  const [text, setText] = useState(filters.q);
  // …but the URL (and therefore the API request) only updates once typing
  // pauses for 300 ms: one request for "keyboard" instead of eight.
  const debouncedText = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  // useEffectEvent reads the latest filters/onChange without re-running the effect.
  const pushSearch = useEffectEvent((value: string) => {
    if (value !== filters.q) onChange({ q: value }, { replace: true });
  });
  useEffect(() => {
    pushSearch(debouncedText);
  }, [debouncedText]);

  // When the URL changes from OUTSIDE (Back button, "Clear filters"), copy the
  // new value into the box ("adjust state while rendering"). If the URL simply
  // caught up with what we debounced, leave the box alone: the user may have
  // kept typing.
  const [prevQ, setPrevQ] = useState(filters.q);
  if (filters.q !== prevQ) {
    setPrevQ(filters.q);
    if (filters.q !== debouncedText) setText(filters.q);
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
          onChange={(event) => setText(event.target.value)}
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
