import { useEffect, useEffectEvent, useState } from 'react';
import { queryCache } from '../api/cache.ts';
import { isAbortError } from '../api/client.ts';
import type { RequestState } from '../types/request.ts';

/** How long data counts as "fresh" by default (D3-5). */
export const DEFAULT_STALE_TIME_MS = 30_000;

export type ApiQuery<T> = {
  state: RequestState<T>;
  /** Fetches again, ignoring the cache (the "Try again" button). */
  refetch: () => void;
};

type ApiQueryOptions = {
  staleTimeMs?: number;
};

type StoredResult<T> = {
  key: string;
  attempt: number;
  state: RequestState<T>;
};

/**
 * Runs `fetcher` for `key` and returns the request state.
 *
 * - `key` identifies WHAT we are loading (e.g. "product:p-0042"). Results are
 *   stored with their key, so a result for an old key is never shown.
 * - D2-4: each run gets an AbortController; the cleanup aborts it when the key
 *   changes or the component unmounts.
 * - D3-5: successful responses go into `queryCache`. If a fresh copy exists
 *   we skip the request entirely; a stale copy is shown while we refetch.
 */
export function useApiQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { staleTimeMs = DEFAULT_STALE_TIME_MS }: ApiQueryOptions = {},
): ApiQuery<T> {
  const [result, setResult] = useState<StoredResult<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  // useEffectEvent: always calls the LATEST fetcher without making the effect
  // re-run every render (the fetcher is a new arrow function each render).
  const load = useEffectEvent((signal: AbortSignal) => fetcher(signal));

  useEffect(() => {
    const cached = queryCache.get<T>(key);
    if (cached && Date.now() - cached.fetchedAt < staleTimeMs) return; // fresh: reuse, no request

    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        queryCache.set(key, data);
        setResult({ key, attempt, state: { status: 'success', data } });
      },
      (error: unknown) => {
        // A cancelled request is not an error: we cancelled it on purpose.
        if (controller.signal.aborted || isAbortError(error)) return;
        // Background refresh failed but we still have a stale copy: keep showing it.
        if (queryCache.get(key)) return;
        setResult({ key, attempt, state: { status: 'error', error } });
      },
    );

    // Cleanup: runs before the next effect (new key/attempt) and on unmount.
    return () => controller.abort();
  }, [key, attempt, staleTimeMs]);

  let state: RequestState<T>;
  if (result !== null && result.key === key && result.attempt === attempt) {
    state = result.state;
  } else {
    const cached = queryCache.get<T>(key);
    state = cached ? { status: 'success', data: cached.data } : { status: 'loading' };
  }

  return {
    state,
    refetch: () => {
      queryCache.invalidate(key); // "try again" must really go to the server
      setAttempt((count) => count + 1);
    },
  };
}
