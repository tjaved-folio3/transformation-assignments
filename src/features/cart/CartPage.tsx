import { Link } from 'react-router';
import { EmptyState } from '../../components/StatusViews.tsx';
import { itemRemoved, quantityChanged } from '../../store/cartSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { selectCartCount, selectCartItems, selectCartTotal } from '../../store/selectors.ts';
import { formatPrice } from '../../utils/format.ts';

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const total = useAppSelector(selectCartTotal);
  const hasUnavailable = items.some((item) => item.stock === 0);

  if (items.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          message="Find something that makes debugging a little more fun."
          action={
            <Link to="/" className="button">
              Browse products
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      <div className="cart">
        <ul className="cart__items">
          {items.map((item) => (
            <li key={item.productId} className="cart-line">
              <img className="cart-line__image" src={item.imageUrl} alt="" width={96} height={72} />
              <div className="cart-line__info">
                <Link to={`/products/${item.productId}`} className="cart-line__name">
                  {item.name}
                </Link>
                <span className="cart-line__unit">{formatPrice(item.price)} each</span>
                {item.stock === 0 ? (
                  <span className="stock stock--out">Out of stock: remove to continue</span>
                ) : (
                  item.quantity >= item.stock && <span className="cart-line__max">Max {item.stock} available</span>
                )}
              </div>
              <div className="stepper" role="group" aria-label={`Quantity of ${item.name}`}>
                <button
                  type="button"
                  className="stepper__button"
                  aria-label={`Decrease quantity of ${item.name}`}
                  disabled={item.quantity <= 1 || item.stock === 0}
                  onClick={() => dispatch(quantityChanged({ productId: item.productId, quantity: item.quantity - 1 }))}
                >
                  −
                </button>
                <span className="stepper__value" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="stepper__button"
                  aria-label={`Increase quantity of ${item.name}`}
                  disabled={item.quantity >= item.stock}
                  onClick={() => dispatch(quantityChanged({ productId: item.productId, quantity: item.quantity + 1 }))}
                >
                  +
                </button>
              </div>
              <span className="cart-line__total">{formatPrice(item.price * item.quantity)}</span>
              <button
                type="button"
                className="button button--link"
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => dispatch(itemRemoved(item.productId))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <aside className="cart__summary" aria-label="Order summary">
          <h2>Summary</h2>
          <p className="cart__row">
            <span>
              {count} {count === 1 ? 'item' : 'items'}
            </span>
            <strong>{formatPrice(total)}</strong>
          </p>
          {hasUnavailable ? (
            <>
              <p className="cart__warning">Remove out-of-stock items to check out.</p>
              <span className="button" aria-disabled="true">
                Checkout
              </span>
            </>
          ) : (
            <Link to="/checkout" className="button">
              Checkout
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
