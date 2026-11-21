import type { Order, OrderItemInput, OrderStatus, Product, User } from '../types/api.ts';
import { generateProducts } from './seed.ts';

/**
 * The mock backend's "database". Products are regenerated from the seed;
 * anything that changes (stock, sessions, orders) is saved to localStorage
 * so a page reload behaves like a real server that remembers things.
 */

type StoredOrder = {
  id: string;
  userId: string;
  items: OrderItemInput[];
  createdAt: number;
};

type PersistedState = {
  stock: Record<string, number>;
  sessions: Record<string, string>; // token -> userId
  orders: Record<string, StoredOrder>;
  idempotency: Record<string, string>; // idempotency key -> order id
};

const DB_KEY = 'bug-bazaar:mock-db';

const USERS: (User & { password: string })[] = [
  { id: 'u-1', email: 'dev@bugbazaar.test', name: 'Dev Duck', password: 'password123' },
];

const products = generateProducts();
const productsById = new Map(products.map((product) => [product.id, product]));

function emptyState(): PersistedState {
  return { stock: {}, sessions: {}, orders: {}, idempotency: {} };
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return emptyState();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: the mock keeps working in memory.
  }
}

function withStock(product: Product): Product {
  const override = state.stock[product.id];
  return override === undefined ? product : { ...product, stock: override };
}

export const db = {
  allProducts(): Product[] {
    return products.map(withStock);
  },

  findProduct(id: string): Product | undefined {
    const product = productsById.get(id);
    return product ? withStock(product) : undefined;
  },

  setStock(id: string, stock: number) {
    state.stock[id] = Math.max(0, stock);
    save();
  },

  findUserByEmail(email: string) {
    return USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },

  createSession(userId: string): string {
    const token = crypto.randomUUID();
    state.sessions[token] = userId;
    save();
    return token;
  },

  /** Reads "Authorization: Bearer <token>" and returns the user, or undefined. */
  userFromAuthHeader(header: string | null): User | undefined {
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    const userId = token ? state.sessions[token] : undefined;
    const user = USERS.find((candidate) => candidate.id === userId);
    if (!user) return undefined;
    return { id: user.id, email: user.email, name: user.name };
  },

  /** Dev panel: invalidates every token, so the next authed request gets a 401. */
  expireAllSessions() {
    state.sessions = {};
    save();
  },

  orderIdForKey(key: string): string | undefined {
    return state.idempotency[key];
  },

  createOrder(userId: string, items: OrderItemInput[], idempotencyKey: string | null): StoredOrder {
    const order: StoredOrder = {
      id: `o-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
      userId,
      items,
      createdAt: Date.now(),
    };
    for (const item of items) {
      const product = this.findProduct(item.productId);
      if (product) state.stock[item.productId] = product.stock - item.quantity;
    }
    state.orders[order.id] = order;
    if (idempotencyKey) state.idempotency[idempotencyKey] = order.id;
    save();
    return order;
  },

  findOrder(id: string): StoredOrder | undefined {
    return state.orders[id];
  },

  /** Tests call this to start from a clean slate. */
  reset() {
    state = emptyState();
    save();
  },
};

/** Orders move queued → processing → confirmed over a few seconds, like a real queue. */
export function orderView(order: StoredOrder): Order {
  const elapsed = Date.now() - order.createdAt;
  const status: OrderStatus = elapsed < 3000 ? 'queued' : elapsed < 6000 ? 'processing' : 'confirmed';
  return { id: order.id, status };
}
