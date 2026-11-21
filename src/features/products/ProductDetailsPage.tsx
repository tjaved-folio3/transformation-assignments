import { Link, useParams } from 'react-router';
import { ApiRequestError } from '../../api/client.ts';
import { fetchProduct } from '../../api/products.ts';
import { NotFoundPage } from '../../components/NotFoundPage.tsx';
import { ErrorState, LoadingState } from '../../components/StatusViews.tsx';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { formatPrice } from '../../utils/format.ts';
import { StockBadge } from './StockBadge.tsx';

export function ProductDetailsPage() {
  const { id = '' } = useParams();
  const { state, refetch } = useApiQuery(`product:${id}`, () => fetchProduct(id));

  if (state.status === 'error' && state.error instanceof ApiRequestError && state.error.status === 404) {
    return <NotFoundPage title="Product not found" message="This product doesn't exist or was removed." />;
  }

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to products
      </Link>
      {(state.status === 'loading' || state.status === 'idle') && (
        <LoadingState label="Loading product…" variant="details" />
      )}
      {state.status === 'error' && (
        <ErrorState
          title="We couldn't load this product"
          message="Something went wrong on our side. Please try again."
          onRetry={refetch}
        />
      )}
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
