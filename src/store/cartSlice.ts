import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../types/api.ts';

/**
 * Cart state. The ONLY way to change it is by dispatching one of the actions
 * below ("defined updates"). Each reducer receives the current state and an
 * action and describes the next state.
 *
 * Redux Toolkit uses Immer, so we can write `item.quantity = 3` and it
 * produces a new immutable object behind the scenes.
 */

export type CartItem = {
  productId: string;
  name: string;
  /** Price in cents, captured when added; the order total is recalculated by the server anyway. */
  price: number;
  imageUrl: string;
  /** Last known stock, used to cap the quantity. */
  stock: number;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

const initialState: CartState = { items: [] };

/** Quantity must be a whole number between 1 and the available stock. */
function clampQuantity(quantity: number, stock: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), stock));
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded(state, action: PayloadAction<{ product: Product; quantity?: number }>) {
      const { product, quantity = 1 } = action.payload;
      if (product.stock <= 0) return; // can't add something that's out of stock
      const existing = state.items.find((item) => item.productId === product.id);
      if (existing) {
        existing.stock = product.stock;
        existing.price = product.price;
        existing.quantity = clampQuantity(existing.quantity + quantity, product.stock);
      } else {
        state.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: clampQuantity(quantity, product.stock),
        });
      }
    },

    quantityChanged(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((candidate) => candidate.productId === action.payload.productId);
      if (item && item.stock > 0) item.quantity = clampQuantity(action.payload.quantity, item.stock);
    },

    itemRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },

    /** New stock info arrived (409 from checkout, or a live update): cap quantities to it. */
    stockUpdated(state, action: PayloadAction<{ productId: string; stock: number }>) {
      const item = state.items.find((candidate) => candidate.productId === action.payload.productId);
      if (!item) return;
      item.stock = Math.max(0, action.payload.stock);
      if (item.stock > 0) item.quantity = clampQuantity(item.quantity, item.stock);
    },

    cartCleared(state) {
      state.items = [];
    },
  },
});

export const { itemAdded, quantityChanged, itemRemoved, stockUpdated, cartCleared } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
