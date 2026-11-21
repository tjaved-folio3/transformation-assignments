import { memo } from 'react';
import { Link } from 'react-router';
import type { Product } from '../../types/api.ts';
import { formatPrice } from '../../utils/format.ts';
import { StockBadge } from './StockBadge.tsx';
import { assetUrl } from '../../utils/assets.ts';

type ProductCardProps = {
  product: Product;
  /** Latest stock (live updates override the value the list was loaded with). */
  stock: number;
};

/**
 * Presentational component: it only receives a product and renders it.
 *
 * D4-3: wrapped in React.memo, so it only re-renders when ITS props change.
 * When a live stock update arrives, the grid re-renders, but 23 of 24 cards
 * (or ~25 of 25 visible in the virtual grid) get identical props and skip
 * rendering. `product` keeps the same object reference and `stock` is a number,
 * so the shallow comparison memo does is enough.
 * The whole card is one real <a> link, so it is reachable with Tab and opens
 * with Enter. No onClick on a <div>, which keyboards can't use.
 */
export const ProductCard = memo(function ProductCard({ product, stock }: ProductCardProps) {
  return (
    <Link to={`/products/${product.id}`} className="product-card__link">
      {/* alt="" because the product name right below says the same thing;
          a screen reader would otherwise read the name twice. */}
      <img
        className="product-card__image"
        src={assetUrl(product.imageUrl)}
        alt=""
        width={200}
        height={150}
        loading="lazy"
      />
      {/* Decorative hover outline. pathLength="1" lets the CSS treat the whole
          outline as length 1, whatever the card's real size is. */}
      <svg className="product-card__outline" aria-hidden="true" focusable="false">
        <rect width="100%" height="100%" rx="4" pathLength="1" />
      </svg>
      <div className="product-card__body">
        <h2 className="product-card__name">{product.name}</h2>
        <span className="rating">★ {product.rating.toFixed(1)}</span>
        <div className="product-card__meta">
          <span className="price">{formatPrice(product.price)}</span>
          <StockBadge stock={stock} />
        </div>
      </div>
    </Link>
  );
});
