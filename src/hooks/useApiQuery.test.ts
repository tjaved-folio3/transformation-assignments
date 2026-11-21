import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useApiQuery } from './useApiQuery.ts';

/** A fetcher whose promise we resolve by hand, to control the order responses arrive in. */
function deferredFetcher() {
  const calls: { signal: AbortSignal; resolve: (value: string) => void }[] = [];
  const fetcher = (signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      calls.push({ signal, resolve });
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  return { calls, fetcher };
}

describe('useApiQuery cleanup (D2-4)', () => {
  it('aborts the in-flight request when the key changes', async () => {
    const { calls, fetcher } = deferredFetcher();
    const { rerender } = renderHook(({ id }) => useApiQuery(`product:${id}`, fetcher), {
      initialProps: { id: 'p-0001' },
    });
    rerender({ id: 'p-0002' });
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[0]?.signal.aborted).toBe(true);
    expect(calls[1]?.signal.aborted).toBe(false);
  });

  it('aborts the in-flight request when the component unmounts', async () => {
    const { calls, fetcher } = deferredFetcher();
    const { unmount } = renderHook(() => useApiQuery('product:p-0001', fetcher));
    await waitFor(() => expect(calls).toHaveLength(1));
    unmount();
    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it('switching products quickly never shows the wrong product', async () => {
    const { calls, fetcher } = deferredFetcher();
    const { result, rerender } = renderHook(({ id }) => useApiQuery(`product:${id}`, fetcher), {
      initialProps: { id: 'p-0001' },
    });
    rerender({ id: 'p-0002' });
    await waitFor(() => expect(calls).toHaveLength(2));
    // The NEW request answers first, then the OLD one answers late.
    await act(async () => calls[1]?.resolve('product two'));
    await act(async () => calls[0]?.resolve('product one'));
    expect(result.current.state).toEqual({ status: 'success', data: 'product two' });
  });
});
