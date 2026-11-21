import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { ProductDetailsPage } from './features/products/ProductDetailsPage.tsx';
import { ProductListPage } from './features/products/ProductListPage.tsx';

/**
 * All routes in one place. Every page renders inside <Layout> (header/footer),
 * and "*" catches any URL that doesn't match, showing a Not Found page.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <ProductListPage /> },
      { path: '/products/:id', element: <ProductDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
