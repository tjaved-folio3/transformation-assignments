/**
 * The shared API contract, typed.
 * Every request and response in the app uses these types, and the mock API
 * (src/mocks) implements exactly these shapes. See docs/api-contract.md.
 */

/** `as const` turns the array into a readonly tuple of literal strings, so we
 *  can loop over the categories at runtime AND derive a union type from them. */
export const CATEGORIES = ['keyboards', 'ducks', 'coffee', 'stickers'] as const;

/** "keyboards" | "ducks" | "coffee" | "stickers" */
export type Category = (typeof CATEGORIES)[number];

export type Product = {
  id: string;
  name: string;
  /** Price in cents. 1999 means $19.99. Never store money as a float. */
  price: number;
  category: Category;
  stock: number;
  rating: number;
  imageUrl: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export const SORT_OPTIONS = ['relevance', 'price-asc', 'price-desc', 'rating', 'name'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Query parameters for GET /api/products. All are optional. */
export type ProductQuery = {
  search?: string;
  category?: Category;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export const ORDER_STATUSES = ['queued', 'processing', 'confirmed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderRequest = {
  items: OrderItemInput[];
};

export type Order = {
  id: string;
  status: OrderStatus;
};
