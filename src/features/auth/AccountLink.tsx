import { NavLink } from 'react-router';
import { useAppSelector } from '../../store/hooks.ts';
import { selectIsAuthenticated } from '../../store/selectors.ts';

export function AccountLink() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? (
    <NavLink to="/account" className="site-nav__link">
      Account
    </NavLink>
  ) : (
    <NavLink to="/login" className="site-nav__link">
      Log in
    </NavLink>
  );
}
