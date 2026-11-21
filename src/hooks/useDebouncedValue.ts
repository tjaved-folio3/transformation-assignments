import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 *
 * Typing "keyboard" changes the input 8 times in about a second; the debounced
 * value changes once, so we send one request instead of eight.
 *
 * How: every change schedules a timer, and the cleanup cancels the previous
 * timer. Only the last timer survives long enough to fire.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
