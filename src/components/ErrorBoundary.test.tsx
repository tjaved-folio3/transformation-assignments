import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { getErrorReports } from '../monitoring/logger.ts';
import { createAppStore } from '../store/store.ts';
import { CrashTest } from './CrashTest.tsx';
import { Layout } from './Layout.tsx';
import { RouteErrorBoundary } from './RouteErrorBoundary.tsx';

describe('error boundary (D4-7)', () => {
  it('shows a fallback screen and logs the error instead of crashing the app', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors too
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          errorElement: <RouteErrorBoundary />,
          children: [{ path: '/', element: <CrashTest /> }],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(
      <Provider store={createAppStore()}>
        <RouterProvider router={router} />
      </Provider>,
    );

    expect(await screen.findByRole('heading', { name: /something broke/i })).toBeInTheDocument();
    expect(screen.queryByText(/Crash test: a component threw/)).toBeNull(); // no raw message on screen
    expect(getErrorReports().at(-1)).toMatchObject({ source: 'route', message: expect.stringMatching(/Crash test/) });
  });
});
