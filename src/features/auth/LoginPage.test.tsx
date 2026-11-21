import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createAppStore } from '../../store/store.ts';
import { server } from '../../test/server.ts';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { LoginPage } from './LoginPage.tsx';

function renderApp(initialPath: string) {
  const store = createAppStore();
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { element: <ProtectedRoute />, children: [{ path: '/checkout', element: <h1>Checkout page</h1> }] },
    ],
    { initialEntries: [initialPath] },
  );
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { store, router };
}

describe('login', () => {
  it('sends a logged-out user to login, then back to the page they wanted', async () => {
    const user = userEvent.setup();
    const { store } = renderApp('/checkout');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeDefined();
    await user.type(screen.getByLabelText('Email'), 'dev@bugbazaar.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Checkout page' })).toBeDefined();
    expect(store.getState().auth.user?.name).toBe('Dev Duck');
  });

  it('shows a friendly message for wrong credentials (401)', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText('Email'), 'dev@bugbazaar.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/incorrect/i);
  });

  it('cannot be double-submitted', async () => {
    let requests = 0;
    server.use(
      http.post('/api/login', async () => {
        requests += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ token: 't', user: { id: 'u-1', email: 'a@b.c', name: 'A' } });
      }),
    );
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText('Email'), 'a@b.c');
    await user.type(screen.getByLabelText('Password'), 'pw');
    const button = screen.getByRole('button', { name: 'Log in' });
    await user.dblClick(button);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(requests).toBe(1));
  });
});
