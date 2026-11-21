/**
 * D3-5: a tiny in-memory cache for GET responses, keyed by the same keys
 * useApiQuery uses ("products?category=ducks", "product:p-0042", "me").
 *
 * - Fresh entries (younger than the query's staleTime) are reused with NO request.
 * - Stale entries are shown immediately, then refreshed in the background
 *   ("stale-while-revalidate").
 * - Mutations invalidate what they affect: placing an order changes stock,
 *   so every product entry is dropped and refetched on next view.
 *
 * It lives in module scope (not React state), so it survives page changes
 * but is cleared by a full reload, which is fine for this app.
 */

type CacheEntry = {
  data: unknown;
  fetchedAt: number;
};

/** Enough for browsing; the oldest entries are dropped beyond this. */
const MAX_ENTRIES = 200;

const entries = new Map<string, CacheEntry>();

export const queryCache = {
  get<T>(key: string): { data: T; fetchedAt: number } | undefined {
    const entry = entries.get(key);
    // The key decides the type (a "product:" key always holds a Product),
    // so this assertion is safe by construction.
    return entry ? { data: entry.data as T, fetchedAt: entry.fetchedAt } : undefined;
  },

  set(key: string, data: unknown) {
    entries.delete(key); // re-insert so Map order = least recently written first
    entries.set(key, { data, fetchedAt: Date.now() });
    if (entries.size > MAX_ENTRIES) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) entries.delete(oldest);
    }
  },

  /** Drops every entry whose key starts with one of the prefixes. */
  invalidate(...prefixes: string[]) {
    for (const key of [...entries.keys()]) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) entries.delete(key);
    }
  },

  clear() {
    entries.clear();
  },
};
