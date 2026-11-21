import { ws } from 'msw';
import { LIVE_STOCK_URL, type LiveStockMessage } from '../api/liveStock.ts';
import { db } from './db.ts';

/**
 * Mock WebSocket server for live stock (D4-4).
 *
 * Each connected client says which products it can see
 * ({ type: "subscribe", productIds }). Every couple of seconds the "warehouse"
 * changes the stock of one of those products (a sale or a restock) and pushes
 * { type: "stock", productId, stock } to that client.
 */

export const stockSocket = ws.link(LIVE_STOCK_URL);

const TICK_MS = import.meta.env.MODE === 'test' ? 20 : 2500;

type Client = Parameters<Parameters<typeof stockSocket.addEventListener<'connection'>>[1]>[0]['client'];
const connected = new Set<Client>();

function parseSubscribe(data: unknown): string[] | null {
  if (typeof data !== 'string') return null;
  try {
    const message: unknown = JSON.parse(data);
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'subscribe' &&
      'productIds' in message &&
      Array.isArray(message.productIds)
    ) {
      return message.productIds.filter((id): id is string => typeof id === 'string').slice(0, 200);
    }
  } catch {
    // ignore malformed messages
  }
  return null;
}

export const liveStockHandler = stockSocket.addEventListener('connection', ({ client }) => {
  connected.add(client);
  let subscribed: string[] = [];

  client.addEventListener('message', (event) => {
    subscribed = parseSubscribe(event.data) ?? subscribed;
  });

  const timer = setInterval(() => {
    if (subscribed.length === 0) return;
    const productId = subscribed[Math.floor(Math.random() * subscribed.length)];
    const product = productId ? db.findProduct(productId) : undefined;
    if (!product) return;
    // Mostly sales (-1…-3); now and then a restock (+5…+15).
    const change = Math.random() < 0.15 ? 5 + Math.floor(Math.random() * 11) : -(1 + Math.floor(Math.random() * 3));
    const stock = Math.max(0, product.stock + change);
    db.setStock(product.id, stock);
    const message: LiveStockMessage = { type: 'stock', productId: product.id, stock };
    client.send(JSON.stringify(message));
  }, TICK_MS);

  client.addEventListener('close', () => {
    clearInterval(timer);
    connected.delete(client);
  });
});

/** Dev panel: simulate the server dropping every connection, to test reconnection. */
export function dropLiveStockConnections() {
  for (const client of connected) client.close(4000, 'Dropped by the dev panel');
}

export function liveConnectionCount(): number {
  return connected.size;
}
