import { delay, http, HttpResponse } from 'msw';
import {
  CATEGORIES,
  SORT_OPTIONS,
  type ApiError,
  type Category,
  type LoginResponse,
  type OrderItemInput,
  type Product,
  type ProductListResponse,
  type SortOption,
} from '../types/api.ts';
import { db, orderView } from './db.ts';
import { isScenarioOn, latencyMs } from './settings.ts';

const API = '/api';
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 5000;

/** Every error response has the contract's ApiError shape. */
function apiError(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiError = { error: { code, message, ...(details ? { details } : {}) } };
  return HttpResponse.json(body, { status });
}

function serverError() {
  return apiError(500, 'INTERNAL_ERROR', 'Simulated server failure');
}

function unauthorized() {
  return apiError(401, 'UNAUTHORIZED', 'Missing or expired session token');
}

function isCategory(value: string | null): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const sorters: Record<SortOption, (a: Product, b: Product) => number> = {
  relevance: (a, b) => a.id.localeCompare(b.id),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.name.localeCompare(b.name),
};

/** Narrows an unknown JSON body to OrderItemInput[] or returns an error message. */
function parseOrderItems(body: unknown): OrderItemInput[] | string {
  if (typeof body !== 'object' || body === null || !('items' in body) || !Array.isArray(body.items)) {
    return 'Order must include an items array';
  }
  if (body.items.length === 0) return 'Your cart is empty';
  const items: OrderItemInput[] = [];
  for (const item of body.items as unknown[]) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('productId' in item) ||
      !('quantity' in item) ||
      typeof item.productId !== 'string' ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return 'Each item needs a productId and a whole-number quantity of at least 1';
    }
    if (!db.findProduct(item.productId)) return `Unknown product ${item.productId}`;
    items.push({ productId: item.productId, quantity: item.quantity });
  }
  return items;
}

export const handlers = [
  // GET /api/products?search=&category=&inStock=&sort=&page=&pageSize=
  http.get(`${API}/products`, async ({ request }) => {
    await delay(latencyMs());
    if (isScenarioOn('products-500')) return serverError();

    const params = new URL(request.url).searchParams;
    const search = (params.get('search') ?? '').trim().toLowerCase();
    const category = params.get('category');
    const inStock = params.get('inStock') === 'true';
    const sortParam = params.get('sort');
    const sort: SortOption = isSortOption(sortParam) ? sortParam : 'relevance';
    const page = toPositiveInt(params.get('page'), 1);
    const pageSize = Math.min(toPositiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

    const matches = db
      .allProducts()
      .filter((product) => !search || product.name.toLowerCase().includes(search))
      .filter((product) => !isCategory(category) || product.category === category)
      .filter((product) => !inStock || product.stock > 0)
      .sort(sorters[sort]);

    const start = (page - 1) * pageSize;
    const body: ProductListResponse = { items: matches.slice(start, start + pageSize), total: matches.length };
    return HttpResponse.json(body);
  }),

  // GET /api/products/:id
  http.get(`${API}/products/:id`, async ({ params }) => {
    await delay(latencyMs());
    if (isScenarioOn('product-500')) return serverError();
    const product = db.findProduct(String(params.id));
    if (!product) return apiError(404, 'NOT_FOUND', `Product ${String(params.id)} does not exist`);
    return HttpResponse.json(product);
  }),

  // POST /api/login
  http.post(`${API}/login`, async ({ request }) => {
    await delay(latencyMs());
    if (isScenarioOn('login-500')) return serverError();

    const body: unknown = await request.json().catch(() => null);
    const email = typeof body === 'object' && body !== null && 'email' in body ? String(body.email).trim() : '';
    const password = typeof body === 'object' && body !== null && 'password' in body ? String(body.password) : '';

    const details: Record<string, string> = {};
    if (!email) details.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) details.email = 'Enter a valid email address';
    if (!password) details.password = 'Password is required';
    if (Object.keys(details).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Login request is invalid', details);
    }

    const user = db.findUserByEmail(email);
    if (!user || user.password !== password) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    const body200: LoginResponse = {
      token: db.createSession(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    };
    return HttpResponse.json(body200);
  }),

  // GET /api/me
  http.get(`${API}/me`, async ({ request }) => {
    await delay(latencyMs());
    const user = db.userFromAuthHeader(request.headers.get('Authorization'));
    return user ? HttpResponse.json(user) : unauthorized();
  }),

  // POST /api/orders  (headers: Authorization, Idempotency-Key)
  http.post(`${API}/orders`, async ({ request }) => {
    await delay(latencyMs());
    const user = db.userFromAuthHeader(request.headers.get('Authorization'));
    if (!user) return unauthorized();

    // Idempotency: the same key always returns the order it created the first time.
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const existingId = idempotencyKey ? db.orderIdForKey(idempotencyKey) : undefined;
    const existing = existingId ? db.findOrder(existingId) : undefined;
    if (existing) return HttpResponse.json(orderView(existing), { status: 201 });

    if (isScenarioOn('orders-500')) return serverError();

    const body: unknown = await request.json().catch(() => null);
    const items = parseOrderItems(body);
    if (typeof items === 'string') return apiError(400, 'VALIDATION_ERROR', items, { items });

    const outOfStock: Record<string, string> = {};
    items.forEach((item, index) => {
      const product = db.findProduct(item.productId);
      const forced = index === 0 && isScenarioOn('orders-409');
      if (product && (forced || item.quantity > product.stock)) {
        // Forced scenario: pretend another shopper just bought the last one.
        if (forced) db.setStock(product.id, 0);
        const left = forced ? 0 : product.stock;
        outOfStock[item.productId] =
          left === 0 ? `${product.name} is out of stock` : `Only ${left} of ${product.name} left`;
      }
    });
    if (Object.keys(outOfStock).length > 0) {
      return apiError(409, 'OUT_OF_STOCK', 'Some items are no longer available', outOfStock);
    }

    const order = db.createOrder(user.id, items, idempotencyKey);
    // Simulates "the server saved the order but the response got lost".
    if (isScenarioOn('orders-500-after-create')) return serverError();
    return HttpResponse.json(orderView(order), { status: 201 });
  }),

  // GET /api/orders/:id
  http.get(`${API}/orders/:id`, async ({ request, params }) => {
    await delay(latencyMs());
    const user = db.userFromAuthHeader(request.headers.get('Authorization'));
    if (!user) return unauthorized();
    const order = db.findOrder(String(params.id));
    if (!order || order.userId !== user.id) return apiError(404, 'NOT_FOUND', 'Order not found');
    return HttpResponse.json(orderView(order));
  }),
];
