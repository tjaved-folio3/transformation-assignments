import { NavLink } from 'react-router';
import { useAppSelector } from '../../store/hooks.ts';
import { selectCartCount } from '../../store/selectors.ts';

/** Header link with a badge. The number is DERIVED by a selector, never stored. */
export function CartLink() {
  const count = useAppSelector(selectCartCount);
  return (
    <NavLink to="/cart" className="site-nav__link">
      Cart
      <span className="badge" aria-hidden="true">
        {count}
      </span>
      <span className="visually-hidden">, {count === 1 ? '1 item' : `${count} items`}</span>
    </NavLink>
  );
}
