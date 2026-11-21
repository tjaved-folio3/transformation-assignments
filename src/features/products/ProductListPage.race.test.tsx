import { act, render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server.ts';
import type { Product, ProductListResponse } from '../../types/api.ts';
import { ProductListPage } from './ProductListPage.tsx';

function fakeProduct(name: string): Product {
  return { id: `p-${name}`, name, price: 999, category: 'ducks', stock: 3, rating: 4, imageUrl: '/images/ducks.svg' };
}

describe('search race conditions (D2-6)', () => {
  it('always shows results for the latest query, even when an older response arrives last', async () => {
    // Out-of-order server: the OLD query is slow (300 ms), the NEW query is fast (20 ms).
    server.use(
      http.get('/api/products', async ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? '';
        await delay(search === 'du' ? 300 : 20);
        const body: ProductListResponse = { items: [fakeProduct(`Result for "${search}"`)], total: 1 };
        return HttpResponse.json(body);
      }),
    );

    const router = createMemoryRouter([{ path: '/', element: <ProductListPage /> }], {
      initialEntries: ['/?q=du'],
    });
    render(<RouterProvider router={router} />);

    // The user refines the query before the first response comes back.
    await act(() => router.navigate('/?q=duck'));

    expect(await screen.findByText('Result for "duck"')).toBeDefined();
    // Wait long enough for the slow, stale response to have arrived (if it wasn't cancelled).
    await act(() => delay(400));
    expect(screen.queryByText('Result for "du"')).toBeNull();
    expect(screen.getByText('Result for "duck"')).toBeDefined();
  });
});
