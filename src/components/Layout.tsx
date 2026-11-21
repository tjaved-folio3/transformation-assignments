import { Link, NavLink, Outlet } from 'react-router';

/**
 * The page frame shared by every route: header, main content, footer.
 * <Outlet /> is where React Router renders the matching child route.
 */
export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
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
          </nav>
        </div>
      </header>
      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>The Bug Bazaar: developer gear for people who ship. All products are fictional.</p>
      </footer>
    </>
  );
}
