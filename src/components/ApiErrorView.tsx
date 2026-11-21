import { toUserError } from '../api/errors.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import { ErrorState } from './StatusViews.tsx';

type ApiErrorViewProps = {
  error: unknown;
  /** What we were loading, e.g. "the products" → "We couldn't load the products". */
  what: string;
  onRetry?: () => void;
};

/**
 * Renders any failed request the same way on every page:
 * 404 → Not Found page, otherwise an error panel with a friendly message and
 * Retry. 401s never get here visibly: the data layer clears the session and
 * <ProtectedRoute> redirects to login.
 */
export function ApiErrorView({ error, what, onRetry }: ApiErrorViewProps) {
  const userError = toUserError(error);
  switch (userError.kind) {
    case 'cancelled':
      return null;
    case 'not-found':
      return <NotFoundPage title={`We couldn't find ${what}`} message={userError.message} />;
    case 'server':
    case 'network':
      return <ErrorState title={`We couldn't load ${what}`} message={userError.message} onRetry={onRetry} />;
    default:
      return <ErrorState title={`We couldn't load ${what}`} message={userError.message} />;
  }
}
