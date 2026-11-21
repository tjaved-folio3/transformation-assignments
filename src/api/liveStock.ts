/**
 * Live stock over WebSockets (D4-4). Part of the data layer: components use
 * the useLiveStock hook and never create sockets themselves.
 *
 * HTTP is request → response: the client has to ask. A WebSocket is one
 * long-lived, two-way connection: after a handshake, the SERVER can push
 * messages whenever stock changes, with no polling.
 */

export const LIVE_STOCK_URL = import.meta.env.VITE_LIVE_STOCK_URL ?? 'wss://live.bugbazaar.test/stock';

export type LiveStockMessage = { type: 'stock'; productId: string; stock: number };
export type LiveStockStatus = 'connecting' | 'live' | 'reconnecting';

type Options = {
  onStock: (message: LiveStockMessage) => void;
  onStatus: (status: LiveStockStatus) => void;
};

export type LiveStockConnection = {
  /** Tell the server which products we're showing. Remembered across reconnects. */
  subscribe: (productIds: string[]) => void;
  /** Close for good (page closed). No reconnects after this. */
  close: () => void;
};

const MAX_BACKOFF_MS = 15_000;

function parseMessage(data: unknown): LiveStockMessage | null {
  if (typeof data !== 'string') return null;
  try {
    const message: unknown = JSON.parse(data);
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'stock' &&
      'productId' in message &&
      'stock' in message &&
      typeof message.productId === 'string' &&
      typeof message.stock === 'number'
    ) {
      return { type: 'stock', productId: message.productId, stock: message.stock };
    }
  } catch {
    // ignore anything that isn't valid JSON
  }
  return null;
}

/**
 * Opens the socket and keeps it open: if the connection drops, it reconnects
 * with exponential backoff (1 s, 2 s, 4 s … up to 15 s, plus random jitter so
 * thousands of clients don't all reconnect at the same instant).
 */
export function connectLiveStock({ onStock, onStatus }: Options): LiveStockConnection {
  let socket: WebSocket | null = null;
  let productIds: string[] = [];
  let failedAttempts = 0;
  let reconnectTimer: number | undefined;
  let closedOnPurpose = false;

  function sendSubscription() {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', productIds }));
    }
  }

  function open() {
    onStatus(failedAttempts === 0 ? 'connecting' : 'reconnecting');
    socket = new WebSocket(LIVE_STOCK_URL);
    socket.addEventListener('open', () => {
      failedAttempts = 0;
      onStatus('live');
      sendSubscription(); // re-subscribe after every (re)connect
    });
    socket.addEventListener('message', (event) => {
      const message = parseMessage(event.data);
      if (message) onStock(message);
    });
    // "error" is always followed by "close", so reconnect logic lives in one place.
    socket.addEventListener('close', () => {
      if (closedOnPurpose) return;
      const delay = Math.min(1000 * 2 ** failedAttempts, MAX_BACKOFF_MS) + Math.random() * 300;
      failedAttempts += 1;
      onStatus('reconnecting');
      reconnectTimer = window.setTimeout(open, delay);
    });
  }

  open();

  return {
    subscribe(ids) {
      productIds = ids;
      sendSubscription();
    },
    close() {
      closedOnPurpose = true;
      window.clearTimeout(reconnectTimer);
      socket?.close(1000, 'Page closed');
    },
  };
}
