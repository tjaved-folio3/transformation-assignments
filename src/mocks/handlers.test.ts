import { describe, expect, it } from 'vitest';
import type { ApiError, LoginResponse, Order, Product, ProductListResponse } from '../types/api.ts';
import { MOCK_SETTINGS_KEY } from './settings.ts';

// Contract tests: the mock API returns the documented shapes and status codes.

async function call<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const response = await fetch(new URL(path, window.location.origin), init);
  return { status: response.status, body: (await response.json()) as T };
}

async function login(): Promise<string> {
  const { body } = await call<LoginResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dev@bugbazaar.test', password: 'password123' }),
  });
  return body.token;
}

function placeOrder(token: string, key: string, items: unknown) {
  return call<Order & ApiError>('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
    body: JSON.stringify({ items }),
  });
}

describe('mock API contract', () => {
  it('lists 5,000 seeded products with paging, filtering and sorting', async () => {
    const all = await call<ProductListResponse>('/api/products');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(5000);
    expect(all.body.items).toHaveLength(24);

    const filtered = await call<ProductListResponse>('/api/products?category=ducks&inStock=true&sort=price-asc');
    const prices = filtered.body.items.map((product) => product.price);
    expect(filtered.body.items.every((product) => product.category === 'ducks' && product.stock > 0)).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('returns a product by id, and a 404 ApiError for an unknown id', async () => {
    const found = await call<Product>('/api/products/p-0001');
    expect(found.status).toBe(200);
    expect(found.body.id).toBe('p-0001');

    const missing = await call<ApiError>('/api/products/p-9999');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('login returns 400 with field details, 401 for bad credentials, 200 with token', async () => {
    const invalid = await call<ApiError>('/api/login', { method: 'POST', body: JSON.stringify({ email: 'nope' }) });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details).toMatchObject({ email: expect.any(String), password: expect.any(String) });

    const wrong = await call<ApiError>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'dev@bugbazaar.test', password: 'wrong' }),
    });
    expect(wrong.status).toBe(401);

    expect(await login()).toEqual(expect.any(String));
  });

  it('GET /api/me needs a valid token', async () => {
    expect((await call('/api/me')).status).toBe(401);
    const token = await login();
    expect((await call('/api/me', { headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
  });

  it('places an order (201) and the same Idempotency-Key never creates a second one', async () => {
    const token = await login();
    const first = await placeOrder(token, 'key-1', [{ productId: 'p-0001', quantity: 1 }]);
    const retry = await placeOrder(token, 'key-1', [{ productId: 'p-0001', quantity: 1 }]);
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('queued');
    expect(retry.body.id).toBe(first.body.id);

    const order = await call<Order>(`/api/orders/${first.body.id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(order.status).toBe(200);
  });

  it('orders return 400, 401 and 409 naming the out-of-stock item', async () => {
    const token = await login();
    expect((await placeOrder(token, 'a', [])).status).toBe(400);
    expect((await placeOrder('bad-token', 'b', [{ productId: 'p-0001', quantity: 1 }])).status).toBe(401);

    const conflict = await placeOrder(token, 'c', [{ productId: 'p-0001', quantity: 9999 }]);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.details?.['p-0001']).toMatch(/left|out of stock/);
  });

  it('forces a 500 when the scenario is switched on', async () => {
    localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify({ scenarios: ['products-500'], latency: 'normal' }));
    const response = await call<ApiError>('/api/products');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });
});
