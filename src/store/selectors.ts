import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store.ts';

/**
 * Derived values are COMPUTED from the cart items, never stored separately.
 * If we stored `count` next to `items`, every action would have to remember
 * to update both, and one day they'd disagree.
 *
 * createSelector memoizes: it only recalculates when `items` changes, and
 * returns the same value otherwise, so components don't re-render needlessly.
 */

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

/** Total in cents. Integer math only. */
export const selectCartTotal = createSelector([selectCartItems], (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);

export const selectCartQuantityFor = (state: RootState, productId: string) =>
  state.cart.items.find((item) => item.productId === productId)?.quantity ?? 0;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.token !== null;
