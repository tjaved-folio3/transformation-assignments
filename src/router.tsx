import { createBrowserRouter } from 'react-router';
import { CrashTest } from './components/CrashTest.tsx';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { RouteErrorBoundary } from './components/RouteErrorBoundary.tsx';
import { AccountPage } from './features/account/AccountPage.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { ProtectedRoute } from './features/auth/ProtectedRoute.tsx';
import { CartPage } from './features/cart/CartPage.tsx';
import { CheckoutPage } from './features/checkout/CheckoutPage.tsx';
import { OrderPage } from './features/orders/OrderPage.tsx';
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
    // Any error thrown while rendering a page lands here (D4-7) instead of a white screen.
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <ProductListPage /> },
      { path: '/products/:id', element: <ProductDetailsPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/account', element: <AccountPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/orders/:id', element: <OrderPage /> },
        ],
      },
      // Only when mocks/dev tools are on: lets us trigger a crash on purpose.
      ...(import.meta.env.VITE_ENABLE_MOCKS !== 'false' ? [{ path: '/debug/crash', element: <CrashTest /> }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
