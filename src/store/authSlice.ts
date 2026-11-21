import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/api.ts';

/** The signed-in session: who you are and the token that proves it. */
export type AuthState = {
  token: string | null;
  user: User | null;
};

const initialState: AuthState = { token: null, user: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    userLoaded(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    /** The user clicked "Log out". */
    loggedOut() {
      return initialState;
    },
    /** The server rejected our token (401). Same result as logging out. */
    sessionExpired() {
      return initialState;
    },
  },
});

export const { loggedIn, userLoaded, loggedOut, sessionExpired } = authSlice.actions;
export const authReducer = authSlice.reducer;
