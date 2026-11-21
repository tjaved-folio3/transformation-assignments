import { describe, expect, it } from 'vitest';
import type { Product } from '../types/api.ts';
import { cartReducer, itemAdded, itemRemoved, quantityChanged, stockUpdated, type CartState } from './cartSlice.ts';
import { selectCartCount, selectCartTotal } from './selectors.ts';
import { createAppStore } from './store.ts';

const duck: Product = {
  id: 'p-0001',
  name: 'Zen Rubber Duck',
  price: 1299,
  category: 'ducks',
  stock: 3,
  rating: 4.5,
  imageUrl: '/images/ducks.svg',
};
const mug: Product = { ...duck, id: 'p-0002', name: 'Hotfix Mug', price: 1599, stock: 10 };
const empty: CartState = { items: [] };

describe('cart logic', () => {
  it('adds a product and merges repeated adds into one line', () => {
    let state = cartReducer(empty, itemAdded({ product: duck }));
    state = cartReducer(state, itemAdded({ product: duck }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(2);
  });

  it('never lets the quantity exceed stock', () => {
    let state = cartReducer(empty, itemAdded({ product: duck, quantity: 2 }));
    state = cartReducer(state, itemAdded({ product: duck, quantity: 5 }));
    expect(state.items[0]?.quantity).toBe(3);
    state = cartReducer(state, quantityChanged({ productId: duck.id, quantity: 99 }));
    expect(state.items[0]?.quantity).toBe(3);
    state = cartReducer(state, quantityChanged({ productId: duck.id, quantity: 0 }));
    expect(state.items[0]?.quantity).toBe(1);
  });

  it('ignores out-of-stock products and removes items', () => {
    let state = cartReducer(empty, itemAdded({ product: { ...duck, stock: 0 } }));
    expect(state.items).toHaveLength(0);
    state = cartReducer(state, itemAdded({ product: mug }));
    state = cartReducer(state, itemRemoved(mug.id));
    expect(state.items).toHaveLength(0);
  });

  it('caps the quantity when stock drops', () => {
    let state = cartReducer(empty, itemAdded({ product: mug, quantity: 8 }));
    state = cartReducer(state, stockUpdated({ productId: mug.id, stock: 2 }));
    expect(state.items[0]).toMatchObject({ quantity: 2, stock: 2 });
  });

  it('derives the badge count and total (in cents) from the items', () => {
    const store = createAppStore();
    store.dispatch(itemAdded({ product: duck, quantity: 2 }));
    store.dispatch(itemAdded({ product: mug, quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(3);
    expect(selectCartTotal(store.getState())).toBe(2 * 1299 + 1599);
  });
});
