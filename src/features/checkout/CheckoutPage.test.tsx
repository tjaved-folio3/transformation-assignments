import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'react-dom';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { login } from '../../api/auth.ts';
import { fetchProduct } from '../../api/products.ts';
import { MOCK_SETTINGS_KEY } from '../../mocks/settings.ts';
import { itemAdded } from '../../store/cartSlice.ts';
import { createAppStore, store as appStore } from '../../store/store.ts';
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx';
import { CheckoutPage } from './CheckoutPage.tsx';

async function setup() {
  // Log in for real against the mock API, then put two products in the cart.
  const session = await login({ email: 'dev@bugbazaar.test', password: 'password123' });
  const store = createAppStore({ auth: { ...session, expired: false } });
  // The data layer reads the token from the app's main store.
  appStore.dispatch({ type: 'auth/loggedIn', payload: session });
  const duck = await fetchProduct('p-0001');
  const mug = await fetchProduct('p-0002');
  store.dispatch(itemAdded({ product: duck, quantity: 2 }));
  store.dispatch(itemAdded({ product: mug, quantity: 1 }));

  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/orders/:id', element: <h1>Order confirmation</h1> },
        ],
      },
      { path: '/cart', element: <h1>Cart page</h1> },
    ],
    { initialEntries: ['/checkout'] },
  );
  render(
    <Provider store={store}>
      <RouterProvider router={router} flushSync={(update) => void flushSync(update)} />
    </Provider>,
  );
  return { store, router, duck, mug };
}

function setScenarios(scenarios: string[]) {
  localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify({ scenarios, latency: 'normal' }));
}

describe('checkout', () => {
  it('places an order, clears the cart and shows the confirmation', async () => {
    const user = userEvent.setup();
    const { store, router } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Place order' }));

    expect(await screen.findByRole('heading', { name: 'Order confirmation' })).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/orders\/o-/);
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it('shows a 409 message naming the item that ran out, and updates the cart', async () => {
    const user = userEvent.setup();
    const { store, duck } = await setup();
    setScenarios(['orders-409']); // the first item sells out just before we order

    await user.click(await screen.findByRole('button', { name: 'Place order' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(`“${duck.name}” is now out of stock`);
    expect(store.getState().cart.items.find((item) => item.productId === duck.id)?.stock).toBe(0);
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled();
  });

  it('retrying after a failed response does not create a duplicate order', async () => {
    const user = userEvent.setup();
    const { router } = await setup();
    // The server SAVES the order but the response fails (lost connection).
    setScenarios(['orders-500-after-create']);
    await user.click(await screen.findByRole('button', { name: 'Place order' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/won't charge you twice/);

    setScenarios([]);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/orders\/o-/));

    const mockDb = JSON.parse(localStorage.getItem('bug-bazaar:mock-db') ?? '{}') as { orders: object };
    expect(Object.keys(mockDb.orders)).toHaveLength(1); // still exactly ONE order
  });
});
