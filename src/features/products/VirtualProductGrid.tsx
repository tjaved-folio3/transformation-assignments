import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { LiveStatus } from '../../components/LiveStatus.tsx';
import { useElementGeometry } from '../../hooks/useElementGeometry.ts';
import { useLiveStock } from '../../hooks/useLiveStock.ts';
import type { Product } from '../../types/api.ts';
import { ProductCard } from './ProductCard.tsx';

/** Must match the CSS: .virtual-grid card height (290px) + row gap (16px). */
const ROW_HEIGHT = 306;
const MIN_CARD_WIDTH = 210;
const GAP = 16;

type VirtualProductGridProps = {
  products: Product[];
};

/**
 * D4-3: renders 5,000 products while only ~5 rows (about 25 cards) exist in
 * the DOM at any time. The page keeps its full scroll height (an empty
 * container sized rows × ROW_HEIGHT), and rows are created/removed as they
 * scroll into or out of view, plus a few "overscan" rows so fast scrolling
 * doesn't flash blank space.
 */
export function VirtualProductGrid({ products }: VirtualProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, top } = useElementGeometry(containerRef);
  const columns = Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));
  const rowCount = Math.ceil(products.length / columns);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
    scrollMargin: top,
  });
  const rows = virtualizer.getVirtualItems();

  // Live stock only for the cards actually on screen.
  const visibleIds = rows.flatMap((row) =>
    products.slice(row.index * columns, row.index * columns + columns).map((product) => product.id),
  );
  const { stockById, status } = useLiveStock(visibleIds);

  return (
    <>
      <LiveStatus status={status} />
      <div
        ref={containerRef}
        className="virtual-grid"
        role="list"
        aria-label={`All ${products.length} products`}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {rows.map((row) => (
          <div
            key={row.key}
            className="virtual-grid__row"
            role="presentation"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            {products.slice(row.index * columns, row.index * columns + columns).map((product, offset) => (
              <div
                key={product.id}
                className="product-card"
                role="listitem"
                aria-posinset={row.index * columns + offset + 1}
                aria-setsize={products.length}
              >
                <ProductCard product={product} stock={stockById[product.id] ?? product.stock} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
