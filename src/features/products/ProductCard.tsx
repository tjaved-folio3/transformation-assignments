import { Link } from 'react-router';
import type { Product } from '../../types/api.ts';
import { formatPrice } from '../../utils/format.ts';
import { StockBadge } from './StockBadge.tsx';
import { assetUrl } from '../../utils/assets.ts';

type ProductCardProps = {
  product: Product;
};

/**
 * Presentational component: it only receives a product and renders it.
 * The whole card is one real <a> link, so it is reachable with Tab and opens
 * with Enter. No onClick on a <div>, which keyboards can't use.
 */
export function ProductCard({ product }: ProductCardProps) {
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
      <div className="product-card__body">
        <h2 className="product-card__name">{product.name}</h2>
        <span className="rating">★ {product.rating.toFixed(1)}</span>
        <div className="product-card__meta">
          <span className="price">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
