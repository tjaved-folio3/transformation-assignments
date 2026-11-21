import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filtersToSearchParams, parseFilters } from './productFilters.ts';

describe('product filters ⇄ URL', () => {
  it('round-trips filters through the URL', () => {
    const filters = { q: 'duck', category: 'ducks', inStock: true, sort: 'price-asc', page: 3 } as const;
    const params = filtersToSearchParams(filters);
    expect(params.toString()).toBe('q=duck&category=ducks&inStock=true&sort=price-asc&page=3');
    expect(parseFilters(params)).toEqual(filters);
  });

  it('falls back to defaults for invalid URL values', () => {
    expect(parseFilters(new URLSearchParams('category=hats&page=-3&sort=random&inStock=yes'))).toEqual(DEFAULT_FILTERS);
  });

  it('keeps default values out of the URL', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });
});
