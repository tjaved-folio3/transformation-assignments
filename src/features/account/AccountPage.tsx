import { useNavigate } from 'react-router';
import { fetchMe } from '../../api/auth.ts';
import { ApiErrorView } from '../../components/ApiErrorView.tsx';
import { LoadingState } from '../../components/StatusViews.tsx';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { loggedOut } from '../../store/authSlice.ts';
import { useAppDispatch } from '../../store/hooks.ts';

/** Protected page. GET /api/me proves the token is still valid; a 401 here signs you out. */
export function AccountPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { state, refetch } = useApiQuery('me', (signal) => fetchMe(signal));
  useDocumentTitle('Your account');

  return (
    <section>
      <div className="page-header">
        <h1>Your account</h1>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            dispatch(loggedOut());
            navigate('/');
          }}
        >
          Log out
        </button>
      </div>
      {state.status === 'loading' && <LoadingState label="Loading your account…" variant="details" />}
      {state.status === 'error' && <ApiErrorView error={state.error} what="your account" onRetry={refetch} />}
      {state.status === 'success' && (
        <dl className="account">
          <dt>Name</dt>
          <dd>{state.data.name}</dd>
          <dt>Email</dt>
          <dd>{state.data.email}</dd>
        </dl>
      )}
    </section>
  );
}
