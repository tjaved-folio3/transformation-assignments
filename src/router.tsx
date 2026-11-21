import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { AccountPage } from './features/account/AccountPage.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { ProtectedRoute } from './features/auth/ProtectedRoute.tsx';
import { ProductDetailsPage } from './features/products/ProductDetailsPage.tsx';
import { ProductListPage } from './features/products/ProductListPage.tsx';

/**
 * All routes in one place. Every page renders inside <Layout> (header/footer).
 * Routes nested under <ProtectedRoute> require a signed-in user.
 * "*" catches any URL that doesn't match and shows a Not Found page.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <ProductListPage /> },
      { path: '/products/:id', element: <ProductDetailsPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/account', element: <AccountPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
