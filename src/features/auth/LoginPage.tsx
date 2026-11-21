import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { login } from '../../api/auth.ts';
import { toUserError } from '../../api/errors.ts';
import { loggedIn } from '../../store/authSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { selectIsAuthenticated } from '../../store/selectors.ts';
import { readRedirectTarget } from './redirect.ts';

type FieldErrors = { email?: string; password?: string };

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionExpired = useAppSelector((state) => state.auth.expired);
  const redirectTo = readRedirectTarget(location.state);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref updates instantly (state updates wait for the next render), so a
  // fast double-click or double Enter can't sneak a second request through.
  const submittingRef = useRef(false);

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError('');
    if (errors.email || errors.password) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const session = await login({ email: email.trim(), password });
      dispatch(loggedIn(session));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const userError = toUserError(error);
      if (userError.kind === 'validation') {
        setFieldErrors({ email: userError.fieldErrors.email, password: userError.fieldErrors.password });
      } else if (userError.kind === 'unauthorized') {
        // On the login page a 401 means wrong credentials, not an expired session.
        setFormError('That email and password combination is incorrect.');
      } else if (userError.kind !== 'cancelled') {
        setFormError(userError.message);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Log in</h1>
      {sessionExpired && (
        <p className="notice" role="status">
          Your session expired. Please log in again.
        </p>
      )}
      <p className="auth-card__hint">
        Demo account: <code>dev@bugbazaar.test</code> / <code>password123</code>
      </p>

      <form noValidate onSubmit={handleSubmit} className="form">
        <div className="field">
          <label className="field__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="field__error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="login-password-error" className="field__error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {formError && (
          <p className="form__error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
