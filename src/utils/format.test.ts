import { describe, expect, it } from 'vitest';
import { formatPrice } from './format.ts';

describe('formatPrice', () => {
  it('formats integer cents as dollars', () => {
    expect(formatPrice(1999)).toBe('$19.99');
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(99)).toBe('$0.99');
    expect(formatPrice(100)).toBe('$1.00');
    expect(formatPrice(1234567)).toBe('$12,345.67');
  });
});
