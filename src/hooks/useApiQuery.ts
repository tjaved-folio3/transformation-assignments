import { useEffect, useEffectEvent, useState } from 'react';
import type { RequestState } from '../types/request.ts';

/**
 * Runs `fetcher` whenever `key` changes and returns the request state.
 *
 * `key` identifies WHAT we are loading (e.g. "product:p-0042"). We store the
 * key next to the result, so when the key changes the old result is ignored
 * and we report "loading" for the new key straight away, without an extra
 * render or a setState call inside the effect.
 */
export function useApiQuery<T>(key: string, fetcher: () => Promise<T>): RequestState<T> {
  const [result, setResult] = useState<{ key: string; state: RequestState<T> } | null>(null);

  // useEffectEvent: always calls the LATEST fetcher without making the effect
  // re-run every render (the fetcher is a new arrow function each render).
  const load = useEffectEvent(() => fetcher());

  useEffect(() => {
    load().then(
      (data) => setResult({ key, state: { status: 'success', data } }),
      (error: unknown) => setResult({ key, state: { status: 'error', error } }),
    );
  }, [key]);

  return result?.key === key ? result.state : { status: 'loading' };
}
