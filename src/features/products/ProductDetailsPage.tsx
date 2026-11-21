import { Link, useParams } from 'react-router';
import { fetchProduct } from '../../api/products.ts';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { formatPrice } from '../../utils/format.ts';
import { StockBadge } from './StockBadge.tsx';

export function ProductDetailsPage() {
  const { id = '' } = useParams();
  const state = useApiQuery(`product:${id}`, () => fetchProduct(id));

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to products
      </Link>
      {state.status === 'loading' && <p>Loading product…</p>}
      {state.status === 'error' && <p>Something went wrong loading this product.</p>}
      {state.status === 'success' && (
        <article className="details">
          <img className="details__image" src={state.data.imageUrl} alt="" width={400} height={300} />
          <div className="details__info">
            <p className="details__category">{state.data.category}</p>
            <h1>{state.data.name}</h1>
            <span className="rating">★ {state.data.rating.toFixed(1)} / 5</span>
            <span className="details__price">{formatPrice(state.data.price)}</span>
            <StockBadge stock={state.data.stock} />
          </div>
        </article>
      )}
    </>
  );
}
