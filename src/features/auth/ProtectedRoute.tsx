import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '../../store/hooks.ts';
import { selectIsAuthenticated } from '../../store/selectors.ts';

/**
 * Wraps routes that need a signed-in user (account, checkout, orders).
 * Not signed in → go to /login and remember where we were, so login can
 * send us back. If a 401 clears the session while we're on a protected page,
 * this re-renders and redirects automatically.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}
