type StockBadgeProps = {
  stock: number;
};

const LOW_STOCK = 5;

export function StockBadge({ stock }: StockBadgeProps) {
  if (stock === 0) return <span className="stock stock--out">Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="stock stock--low">Only {stock} left</span>;
  return <span className="stock">{stock} in stock</span>;
}
