import { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router';
import { logError } from '../monitoring/logger.ts';
import { ErrorFallback } from './ErrorFallback.tsx';

/**
 * React Router's errorElement: catches errors thrown while rendering any page.
 * It logs once per error (the effect runs when `error` changes) and shows the fallback.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    logError(error, 'route');
  }, [error]);

  return (
    <main className="site-main">
      <ErrorFallback onReset={() => navigate(0)} />
    </main>
  );
}
