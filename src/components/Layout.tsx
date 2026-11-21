import { Link, NavLink, Outlet } from 'react-router';
import { AccountLink } from '../features/auth/AccountLink.tsx';
import { CartLink } from '../features/cart/CartLink.tsx';
import { useScrolledPast } from '../hooks/useScrolledPast.ts';
import { RouteFocus } from './RouteFocus.tsx';

/**
 * The page frame shared by every route: header, main content, footer.
 * <Outlet /> is where React Router renders the matching child route.
 */
export function Layout() {
  // Same hook as BackToTop: adds a shadow under the sticky header once you scroll.
  const scrolled = useScrolledPast(8);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={scrolled ? 'site-header site-header--scrolled' : 'site-header'}>
        <div className="site-header__inner">
          <Link to="/" className="site-logo">
            <span className="site-logo__mark" aria-hidden="true">
              🦆
            </span>
            The Bug Bazaar
          </Link>
          <nav aria-label="Main" className="site-nav">
            <NavLink to="/" end className="site-nav__link">
              Shop
            </NavLink>
            <CartLink />
            <AccountLink />
          </nav>
        </div>
      </header>
      <RouteFocus />
      {/* tabIndex={-1}: focusable from code (skip link, route changes) but not a Tab stop. */}
      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>The Bug Bazaar: developer gear for people who ship. All products are fictional.</p>
      </footer>
    </>
  );
}
