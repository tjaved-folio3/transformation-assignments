import { Link, useParams } from 'react-router';
import { toUserError } from '../../api/errors.ts';
import { fetchProduct } from '../../api/products.ts';
import { BackToTop } from '../../components/BackToTop.tsx';
import { NotFoundPage } from '../../components/NotFoundPage.tsx';
import { ApiErrorView } from '../../components/ApiErrorView.tsx';
import { LoadingState } from '../../components/StatusViews.tsx';
import { useApiQuery } from '../../hooks/useApiQuery.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { useLiveStock } from '../../hooks/useLiveStock.ts';
import { AddToCart } from '../cart/AddToCart.tsx';
import { formatPrice } from '../../utils/format.ts';
import { StockBadge } from './StockBadge.tsx';
import { assetUrl } from '../../utils/assets.ts';

/** Ids run from p-0001 to p-5000 (see docs/api-contract.md). */
const LAST_PRODUCT_NUMBER = 5000;

/** "p-0042" → { previous: "p-0041", next: "p-0043" } (undefined at the ends). */
function neighbourIds(id: string) {
  const number = Number(id.slice(2));
  const toId = (value: number) => `p-${String(value).padStart(4, '0')}`;
  if (!id.startsWith('p-') || !Number.isInteger(number)) return {};
  return {
    previous: number > 1 ? toId(number - 1) : undefined,
    next: number < LAST_PRODUCT_NUMBER ? toId(number + 1) : undefined,
  };
}

export function ProductDetailsPage() {
  const { id = '' } = useParams();
  // The signal lets useApiQuery cancel this request when `id` changes or the page closes.
  const { state, refetch } = useApiQuery(`product:${id}`, (signal) => fetchProduct(id, signal));
  const { previous, next } = neighbourIds(id);
  useDocumentTitle(state.status === 'success' ? state.data.name : 'Product');
  const { stockById } = useLiveStock(state.status === 'success' ? [id] : []);
  const liveProduct =
    state.status === 'success' ? { ...state.data, stock: stockById[id] ?? state.data.stock } : undefined;

  if (state.status === 'error' && toUserError(state.error).kind === 'not-found') {
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
      {state.status === 'error' && <ApiErrorView error={state.error} what="this product" onRetry={refetch} />}
      {liveProduct && (
        <article className="details">
          <img className="details__image" src={assetUrl(liveProduct.imageUrl)} alt="" width={400} height={300} />
          <div className="details__info">
            <p className="details__category">{liveProduct.category}</p>
            <h1>{liveProduct.name}</h1>
            <span className="rating">★ {liveProduct.rating.toFixed(1)} / 5</span>
            <span className="details__price">{formatPrice(liveProduct.price)}</span>
            <StockBadge stock={liveProduct.stock} />
            {/* key: reset the quantity picker when switching to another product */}
            <AddToCart key={liveProduct.id} product={liveProduct} />
          </div>
        </article>
      )}
      {/* Quick product switching: the scenario D2-4 must handle safely. */}
      <nav className="details__nav" aria-label="Browse products">
        {previous ? <Link to={`/products/${previous}`}>← Previous product</Link> : <span />}
        {next && <Link to={`/products/${next}`}>Next product →</Link>}
      </nav>
      <BackToTop />
    </>
  );
}
