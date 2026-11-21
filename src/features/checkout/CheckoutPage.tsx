import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ApiRequestError } from '../../api/client.ts';
import { createOrder } from '../../api/orders.ts';
import { fetchProduct } from '../../api/products.ts';
import { cartCleared, stockUpdated } from '../../store/cartSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { selectCartItems, selectCartTotal, selectCurrentUser } from '../../store/selectors.ts';
import { formatPrice } from '../../utils/format.ts';
import { cartSignature, clearCheckoutKey, getCheckoutKey } from './idempotency.ts';

type CheckoutError = { kind: 'conflict'; messages: string[] } | { kind: 'retryable'; message: string };

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const user = useAppSelector(selectCurrentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);
  const submittingRef = useRef(false);

  if (items.length === 0 && !isSubmitting) return <Navigate to="/cart" replace />;
  const hasUnavailable = items.some((item) => item.stock === 0);

  /** After a 409, ask the server for the real stock of the named items and fix the cart. */
  async function refreshStock(productIds: string[]): Promise<string[]> {
    const messages: string[] = [];
    for (const productId of productIds) {
      const name = items.find((item) => item.productId === productId)?.name ?? 'An item';
      try {
        const product = await fetchProduct(productId);
        dispatch(stockUpdated({ productId, stock: product.stock }));
        messages.push(
          product.stock === 0
            ? `“${name}” is now out of stock. Remove it from your cart to continue.`
            : `Only ${product.stock} of “${name}” left. We lowered the quantity in your cart.`,
        );
      } catch {
        messages.push(`“${name}” is no longer available in that quantity.`);
      }
    }
    return messages;
  }

  async function placeOrder() {
    if (submittingRef.current) return; // blocks double clicks before React re-renders
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const idempotencyKey = getCheckoutKey(cartSignature(items));
    try {
      const order = await createOrder(
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        idempotencyKey,
      );
      clearCheckoutKey();
      // Leave the page FIRST (flushSync commits the navigation immediately),
      // then empty the cart. In the other order, the cart update re-renders
      // this page with an empty cart and its guard redirects to /cart instead.
      navigate(`/orders/${order.id}`, { replace: true, flushSync: true });
      dispatch(cartCleared());
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.status === 409) {
        setError({ kind: 'conflict', messages: await refreshStock(Object.keys(caught.details ?? {})) });
      } else if (caught instanceof ApiRequestError && caught.status === 401) {
        // The data layer already cleared the session; ProtectedRoute will
        // redirect to login and bring the user back here afterwards.
      } else {
        setError({
          kind: 'retryable',
          message: "We couldn't place your order. Your cart is safe, and retrying won't charge you twice.",
        });
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="checkout">
      <h1>Checkout</h1>
      {user && <p>Ordering as {user.email}</p>}

      <ul className="checkout__lines">
        {items.map((item) => (
          <li key={item.productId} className="checkout__line">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="checkout__total">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </p>

      {error?.kind === 'conflict' && (
        <div className="form__error" role="alert">
          <p>Some items changed while you were shopping:</p>
          <ul>
            {error.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <Link to="/cart">Review your cart</Link>
        </div>
      )}
      {error?.kind === 'retryable' && (
        <p className="form__error" role="alert">
          {error.message}
        </p>
      )}

      <button
        type="button"
        className="button checkout__submit"
        onClick={placeOrder}
        disabled={isSubmitting || hasUnavailable}
      >
        {isSubmitting ? 'Placing order…' : error?.kind === 'retryable' ? 'Try again' : 'Place order'}
      </button>
    </section>
  );
}
