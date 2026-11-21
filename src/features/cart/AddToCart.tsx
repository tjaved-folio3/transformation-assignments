import { useState } from 'react';
import { Link } from 'react-router';
import { itemAdded } from '../../store/cartSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { selectCartQuantityFor } from '../../store/selectors.ts';
import type { Product } from '../../types/api.ts';

type AddToCartProps = {
  product: Product;
};

/** Quantity picker + "Add to cart". You can't pick more than what's left in stock. */
export function AddToCart({ product }: AddToCartProps) {
  const dispatch = useAppDispatch();
  const inCart = useAppSelector((state) => selectCartQuantityFor(state, product.id));
  const remaining = Math.max(0, product.stock - inCart);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const safeQuantity = Math.min(quantity, Math.max(remaining, 1));

  if (product.stock === 0) {
    return <p className="add-to-cart__note">This item is out of stock.</p>;
  }

  return (
    <div className="add-to-cart">
      {remaining > 0 ? (
        <form
          className="add-to-cart__form"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch(itemAdded({ product, quantity: safeQuantity }));
            setMessage(`Added ${safeQuantity} to your cart.`);
            setQuantity(1);
          }}
        >
          <div className="field">
            <label className="field__label" htmlFor="add-quantity">
              Quantity
            </label>
            <select
              id="add-quantity"
              className="select"
              value={safeQuantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {Array.from({ length: Math.min(remaining, 10) }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button">
            Add to cart
          </button>
        </form>
      ) : (
        <p className="add-to-cart__note">You have all {product.stock} available in your cart.</p>
      )}
      {/* role="status" makes screen readers announce the confirmation. */}
      <p role="status" className="add-to-cart__message">
        {message}{' '}
        {message && (
          <Link to="/cart" className="add-to-cart__link">
            View cart
          </Link>
        )}
      </p>
    </div>
  );
}
