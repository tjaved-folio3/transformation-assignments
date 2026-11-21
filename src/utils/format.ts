/**
 * Prices are stored as integer cents (1999 = $19.99) so that adding them up
 * never hits floating-point errors (0.1 + 0.2 !== 0.3). We only divide by
 * 100 at the very last moment, for display.
 *
 * The formatter is created once and reused: building an Intl.NumberFormat is
 * relatively expensive, and the grid formats many prices per render.
 */
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

const numberFormatter = new Intl.NumberFormat('en-US');

/** 1154 → "1,154" */
export function formatCount(value: number): string {
  return numberFormatter.format(value);
}
