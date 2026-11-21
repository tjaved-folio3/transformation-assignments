import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './authSlice.ts';
import { cartReducer } from './cartSlice.ts';

/**
 * The single Redux store: global CLIENT state that many components share
 * (cart, session). Server data (products) is NOT kept here; see
 * docs/decisions.md (D3-1) for why.
 */
export function createAppStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
    },
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
