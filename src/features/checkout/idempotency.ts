import type { CartItem } from '../../store/cartSlice.ts';

/**
 * Idempotency key for checkout (D3-2).
 *
 * The key identifies ONE checkout attempt. The server remembers which order
 * each key created; sending the same key again returns that order instead of
 * creating (and charging for) a second one.
 *
 * The key is tied to a "signature" of the cart contents and saved in
 * sessionStorage, so:
 *  - Retry after an error → same cart → same key → no duplicate order.
 *  - Retry after a page reload mid-request → still the same key.
 *  - Cart changed (e.g. after a 409) → new signature → new key, because it's
 *    genuinely a different order.
 */

const STORAGE_KEY = 'bug-bazaar:checkout-attempt';

export function cartSignature(items: CartItem[]): string {
  return items
    .map((item) => `${item.productId}x${item.quantity}`)
    .sort()
    .join(',');
}

export function getCheckoutKey(signature: string): string {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (
      typeof stored === 'object' &&
      stored !== null &&
      'signature' in stored &&
      'key' in stored &&
      stored.signature === signature &&
      typeof stored.key === 'string'
    ) {
      return stored.key;
    }
  } catch {
    // fall through and create a new key
  }
  const key = crypto.randomUUID();
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ signature, key }));
  } catch {
    // storage unavailable: the key still protects retries within this page
  }
  return key;
}

/** After a successful order the attempt is finished; the next checkout gets a fresh key. */
export function clearCheckoutKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
