import { useEffect, useState } from 'react';

/**
 * Like useState, but the value is saved to localStorage and restored on reload.
 *
 * `parse` turns the stored string (or null when nothing is stored) back into
 * a valid T. Storage can contain anything (an old format, hand-edited junk), so
 * the caller decides how to validate it instead of us blindly trusting JSON.parse.
 *
 * Also listens for the "storage" event, so two open tabs stay in sync; that
 * listener is cleaned up on unmount.
 */
export function useLocalStorage<T>(key: string, parse: (raw: string | null) => T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => parse(readRaw(key)));

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) setValue(parse(event.newValue));
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, parse]);

  function update(next: T) {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or storage full: keep working in memory.
    }
  }

  return [value, update];
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
