import type { CreateOrderRequest, Order, OrderItemInput } from '../types/api.ts';
import { apiRequest } from './client.ts';

/**
 * The Idempotency-Key tells the server "this is the same checkout attempt".
 * Sending the same key twice returns the first order instead of a new one.
 */
export function createOrder(items: OrderItemInput[], idempotencyKey: string) {
  const body: CreateOrderRequest = { items };
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export function fetchOrder(id: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/orders/${encodeURIComponent(id)}`, { signal });
}
