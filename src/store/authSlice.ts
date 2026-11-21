import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/api.ts';

/** The signed-in session: who you are and the token that proves it. */
export type AuthState = {
  token: string | null;
  user: User | null;
  /** True after a 401 kicked us out, so the login page can explain why. */
  expired: boolean;
};

export const initialAuthState: AuthState = { token: null, user: null, expired: false };

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loggedIn(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.expired = false;
    },
    userLoaded(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    /** The user clicked "Log out". */
    loggedOut() {
      return initialAuthState;
    },
    /** The server rejected our token (401): clear the session and remember why. */
    sessionExpired() {
      return { ...initialAuthState, expired: true };
    },
  },
});

export const { loggedIn, userLoaded, loggedOut, sessionExpired } = authSlice.actions;
export const authReducer = authSlice.reducer;
