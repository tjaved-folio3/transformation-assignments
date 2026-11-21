import { useEffect, useEffectEvent, useState } from 'react';
import { isAbortError } from '../api/client.ts';
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
 * result is ignored and we report "loading" straight away.
 *
 * D2-4 cleanup: every run gets its own AbortController. When the key changes
 * (user switches product) or the component unmounts (user leaves the page),
 * React runs the cleanup function, which aborts the in-flight request. The
 * old response can therefore never overwrite the new one.
 */
export function useApiQuery<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>): ApiQuery<T> {
  const [result, setResult] = useState<StoredResult<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  // useEffectEvent: always calls the LATEST fetcher without making the effect
  // re-run every render (the fetcher is a new arrow function each render).
  const load = useEffectEvent((signal: AbortSignal) => fetcher(signal));

  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, attempt, state: { status: 'success', data } });
      },
      (error: unknown) => {
        // A cancelled request is not an error: we cancelled it on purpose.
        if (controller.signal.aborted || isAbortError(error)) return;
        setResult({ key, attempt, state: { status: 'error', error } });
      },
    );

    // Cleanup: runs before the next effect (new key/attempt) and on unmount.
    return () => controller.abort();
  }, [key, attempt]);

  const isCurrent = result !== null && result.key === key && result.attempt === attempt;
  return {
    state: isCurrent ? result.state : { status: 'loading' },
    refetch: () => setAttempt((count) => count + 1),
  };
}
