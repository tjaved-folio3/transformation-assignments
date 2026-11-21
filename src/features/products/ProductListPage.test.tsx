import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ProductListPage } from './ProductListPage.tsx';

function renderList(path = '/') {
  const router = createMemoryRouter([{ path: '/', element: <ProductListPage /> }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('product filtering', () => {
  it('filters by category and in-stock, updates the URL and can clear', async () => {
    const user = userEvent.setup();
    const router = renderList();
    expect(await screen.findByText('5,000 products')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Category'), 'ducks');
    await user.click(screen.getByLabelText('In stock only'));

    expect(router.state.location.search).toBe('?category=ducks&inStock=true');
    const cards = await screen.findAllByRole('link', { name: /duck/i });
    expect(cards.length).toBeGreaterThan(0);
    expect(within(screen.getByRole('list')).queryByText('Out of stock')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(router.state.location.search).toBe('');
    expect(await screen.findByText('5,000 products')).toBeInTheDocument();
  });

  it('restores the same view from a copied link', async () => {
    renderList('/?q=pirate&sort=price-asc');
    expect(await screen.findByLabelText('Search')).toHaveValue('pirate');
    expect(screen.getByLabelText('Sort by')).toHaveValue('price-asc');
    const prices = (await screen.findAllByText(/^\$\d/)).map((node) => Number(node.textContent?.replace(/[$,]/g, '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('shows the empty state with a way out when nothing matches', async () => {
    renderList('/?q=zzzz-no-such-thing');
    expect(await screen.findByRole('heading', { name: 'No products match' })).toBeInTheDocument();
  });
});
