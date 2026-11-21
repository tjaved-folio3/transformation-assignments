import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { configureApiAuth } from '../api/client.ts';
import { authReducer, sessionExpired } from './authSlice.ts';
import { cartReducer } from './cartSlice.ts';
import { loadAuthState, loadCartState, persistenceMiddleware } from './persistence.ts';

/**
 * The single Redux store: global CLIENT state that many components share
 * (cart, session). Server data (products) is NOT kept here; see
 * docs/decisions.md (D3-1) for why.
 */

const rootReducer = combineReducers({
  cart: cartReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistenceMiddleware.middleware),
  });
}

export const store = createAppStore({ auth: loadAuthState(), cart: loadCartState() });

/**
 * Plug the store into the data layer (dependency injection, see D1-4):
 *  - every request reads the current token
 *  - any 401 on an authenticated request clears the session everywhere
 */
configureApiAuth({
  getToken: () => store.getState().auth.token,
  onUnauthorized: () => store.dispatch(sessionExpired()),
});

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
