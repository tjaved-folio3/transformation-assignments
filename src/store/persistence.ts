import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { queryCache } from '../api/cache.ts';
import type { User } from '../types/api.ts';
import { initialAuthState, loggedIn, loggedOut, sessionExpired, userLoaded, type AuthState } from './authSlice.ts';
import {
  cartCleared,
  itemAdded,
  itemRemoved,
  quantityChanged,
  stockUpdated,
  type CartItem,
  type CartState,
} from './cartSlice.ts';

/**
 * Saves parts of the Redux state to localStorage and loads them at startup.
 *
 * A listener middleware watches for specific actions and runs a side effect
 * after the reducer has updated the state. Reducers themselves must stay
 * pure (no localStorage calls inside them).
 */

export const AUTH_STORAGE_KEY = 'bug-bazaar:auth';
export const CART_STORAGE_KEY = 'bug-bazaar:cart';

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / storage full: the app still works, it just won't persist.
  }
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string'
  );
}

/** Never trust storage: anything malformed means "not logged in". */
export function loadAuthState(): AuthState {
  const stored = readJson(AUTH_STORAGE_KEY);
  if (typeof stored === 'object' && stored !== null && 'token' in stored && typeof stored.token === 'string') {
    const user = 'user' in stored && isUser(stored.user) ? stored.user : null;
    return { token: stored.token, user, expired: false };
  }
  return initialAuthState;
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.imageUrl === 'string' &&
    Number.isInteger(item.price) &&
    Number.isInteger(item.stock) &&
    Number.isInteger(item.quantity) &&
    (item.quantity as number) >= 1
  );
}

/** Restores the cart, dropping any saved line that isn't a valid CartItem. */
export function loadCartState(): CartState {
  const stored = readJson(CART_STORAGE_KEY);
  if (typeof stored === 'object' && stored !== null && 'items' in stored && Array.isArray(stored.items)) {
    return { items: stored.items.filter(isCartItem) };
  }
  return { items: [] };
}

export const persistenceMiddleware = createListenerMiddleware<{ auth: AuthState; cart: CartState }>();

persistenceMiddleware.startListening({
  matcher: isAnyOf(itemAdded, quantityChanged, itemRemoved, stockUpdated, cartCleared),
  effect: (_action, api) => {
    writeJson(CART_STORAGE_KEY, api.getState().cart);
  },
});

persistenceMiddleware.startListening({
  matcher: isAnyOf(loggedIn, userLoaded, loggedOut, sessionExpired),
  effect: (_action, api) => {
    // A different (or no) user: cached per-user data like "me" must not leak across sessions.
    queryCache.invalidate('me');
    const { token, user } = api.getState().auth;
    if (token) writeJson(AUTH_STORAGE_KEY, { token, user });
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  },
});
