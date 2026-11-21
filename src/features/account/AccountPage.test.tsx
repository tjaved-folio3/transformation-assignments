import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { loggedIn } from '../../store/authSlice.ts';
import { store } from '../../store/store.ts';
import { LoginPage } from '../auth/LoginPage.tsx';
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx';
import { AccountPage } from './AccountPage.tsx';

describe('401 handling', () => {
  it('a 401 clears the session and sends the user to login with an explanation', async () => {
    // A token the server doesn't know: like one that expired or was revoked.
    store.dispatch(loggedIn({ token: 'revoked-token', user: { id: 'u-1', email: 'dev@bugbazaar.test', name: 'Dev' } }));
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { element: <ProtectedRoute />, children: [{ path: '/account', element: <AccountPage /> }] },
      ],
      { initialEntries: ['/account'] },
    );
    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    expect(await screen.findByText('Your session expired. Please log in again.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(store.getState().auth.token).toBeNull();
    expect(localStorage.getItem('bug-bazaar:auth')).toBeNull();
  });
});
