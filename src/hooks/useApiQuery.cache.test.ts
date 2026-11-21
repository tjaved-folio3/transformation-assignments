import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryCache } from '../api/cache.ts';
import { useApiQuery } from './useApiQuery.ts';

describe('useApiQuery caching (D3-5)', () => {
  afterEach(() => queryCache.clear());

  it('revisiting a page reuses cached data instead of refetching', async () => {
    const fetcher = vi.fn(async () => 'duck data');
    const first = renderHook(() => useApiQuery('product:p-0001', fetcher));
    await waitFor(() => expect(first.result.current.state.status).toBe('success'));
    first.unmount(); // user navigates away…

    const second = renderHook(() => useApiQuery('product:p-0001', fetcher)); // …and comes back
    expect(second.result.current.state).toEqual({ status: 'success', data: 'duck data' }); // instantly, no skeleton
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches after the cache is invalidated (e.g. an order changed stock)', async () => {
    const fetcher = vi.fn(async () => 'fresh');
    const first = renderHook(() => useApiQuery('product:p-0001', fetcher));
    await waitFor(() => expect(first.result.current.state.status).toBe('success'));
    first.unmount();

    queryCache.invalidate('product:');
    const second = renderHook(() => useApiQuery('product:p-0001', fetcher));
    expect(second.result.current.state.status).toBe('loading');
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
