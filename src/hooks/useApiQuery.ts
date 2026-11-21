import { useEffect, useEffectEvent, useState } from 'react';
import type { RequestState } from '../types/request.ts';

export type ApiQuery<T> = {
  state: RequestState<T>;
  /** Runs the request again (the "Try again" button). */
  refetch: () => void;
};

type StoredResult<T> = {
  key: string;
  attempt: number;
  state: RequestState<T>;
};

/**
 * Runs `fetcher` whenever `key` changes and returns the request state.
 *
 * `key` identifies WHAT we are loading (e.g. "product:p-0042"). We store the
 * key (and attempt number) next to the result, so when either changes the old
 * result is ignored and we report "loading" straight away, without an extra
 * render or a setState call inside the effect.
 */
export function useApiQuery<T>(key: string, fetcher: () => Promise<T>): ApiQuery<T> {
  const [result, setResult] = useState<StoredResult<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  // useEffectEvent: always calls the LATEST fetcher without making the effect
  // re-run every render (the fetcher is a new arrow function each render).
  const load = useEffectEvent(() => fetcher());

  useEffect(() => {
    load().then(
      (data) => setResult({ key, attempt, state: { status: 'success', data } }),
      (error: unknown) => setResult({ key, attempt, state: { status: 'error', error } }),
    );
  }, [key, attempt]);

  const isCurrent = result !== null && result.key === key && result.attempt === attempt;
  return {
    state: isCurrent ? result.state : { status: 'loading' },
    refetch: () => setAttempt((count) => count + 1),
  };
}
