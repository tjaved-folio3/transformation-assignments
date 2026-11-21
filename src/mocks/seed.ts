import { CATEGORIES, type Category, type Product } from '../types/api.ts';

export const PRODUCT_COUNT = 5000;

/**
 * mulberry32: a tiny *seeded* pseudo-random number generator.
 * Math.random() gives different numbers on every reload; a seeded generator
 * gives the SAME sequence every time, so product p-0042 is always the same
 * product. That makes links, tests and bug reports reproducible.
 */
function createRandom(seed: number) {
  let state = seed;
  return function random(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CategoryCatalog = {
  adjectives: readonly string[];
  nouns: readonly string[];
  /** Price range in cents. */
  minPrice: number;
  maxPrice: number;
};

const CATALOG: Record<Category, CategoryCatalog> = {
  keyboards: {
    adjectives: ['Clicky', 'Silent', 'Tactile', 'Linear', 'Retro', 'Compact', 'Split', 'Ergo', 'Glow', 'Stealth'],
    nouns: ['Mechanical Keyboard', '60% Board', 'TKL Keyboard', 'Split Keyboard', 'Keycap Set', 'Macro Pad'],
    minPrice: 4900,
    maxPrice: 24900,
  },
  ducks: {
    adjectives: ['Debugging', 'Senior', 'Pirate', 'Zen', 'Ninja', 'Golden', 'Classic', 'Tiny', 'Giant', 'Night-Shift'],
    nouns: ['Rubber Duck', 'Duck', 'Duckling', 'Duck Squad'],
    minPrice: 499,
    maxPrice: 2999,
  },
  coffee: {
    adjectives: ['Midnight', 'Sprint', 'Deploy-Day', 'Hotfix', 'Standup', 'Refactor', 'Merge', 'Legacy'],
    nouns: ['Espresso Beans', 'Cold Brew', 'Dark Roast', 'Pour-Over Kit', 'Mug'],
    minPrice: 899,
    maxPrice: 3499,
  },
  stickers: {
    adjectives: ['Works On My Machine', 'Ship It', 'LGTM', '404', 'Semicolon', 'Git Blame', 'Tabs vs Spaces', 'Null Pointer'],
    nouns: ['Sticker', 'Sticker Pack', 'Holo Sticker', 'Laptop Decal'],
    minPrice: 199,
    maxPrice: 999,
  },
};

const COLORS = ['Black', 'White', 'Teal', 'Coral', 'Purple', 'Amber', 'Mint', 'Navy'];

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

/** Builds the same 5,000 products on every call. */
export function generateProducts(count = PRODUCT_COUNT, seed = 2026): Product[] {
  const random = createRandom(seed);
  const products: Product[] = [];

  for (let index = 1; index <= count; index += 1) {
    const category = pick(CATEGORIES, random);
    const catalog = CATALOG[category];
    // Round to a "x.99" price, e.g. 1999 cents = $19.99.
    const rawPrice = catalog.minPrice + random() * (catalog.maxPrice - catalog.minPrice);
    const price = Math.floor(rawPrice / 100) * 100 + 99;
    // Roughly 1 in 10 products is out of stock, so the in-stock filter matters.
    const stock = random() < 0.1 ? 0 : 1 + Math.floor(random() * 60);
    const rating = Math.round((2.5 + random() * 2.5) * 10) / 10;

    products.push({
      id: `p-${String(index).padStart(4, '0')}`,
      name: `${pick(catalog.adjectives, random)} ${pick(catalog.nouns, random)} (${pick(COLORS, random)})`,
      price,
      category,
      stock,
      rating,
      imageUrl: `/images/${category}.svg`,
    });
  }

  return products;
}
