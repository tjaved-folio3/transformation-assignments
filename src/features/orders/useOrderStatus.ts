import { useEffect, useState } from 'react';
import { isAbortError } from '../../api/client.ts';
import { fetchOrder } from '../../api/orders.ts';
import type { Order } from '../../types/api.ts';
import type { RequestState } from '../../types/request.ts';

const POLL_MS = 1500;

/**
 * Loads an order and keeps polling until it's confirmed (the mock "queue"
 * moves it queued → processing → confirmed).
 *
 * Cleanup stops BOTH the pending request (abort) and the next scheduled poll
 * (clearTimeout), so nothing keeps running after you leave the page.
 */
export function useOrderStatus(orderId: string): RequestState<Order> {
  const [result, setResult] = useState<{ orderId: string; state: RequestState<Order> } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    async function poll() {
      try {
        const order = await fetchOrder(orderId, controller.signal);
        setResult({ orderId, state: { status: 'success', data: order } });
        if (order.status !== 'confirmed') timer = window.setTimeout(poll, POLL_MS);
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setResult({ orderId, state: { status: 'error', error } });
      }
    }
    void poll();

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [orderId]);

  return result?.orderId === orderId ? result.state : { status: 'loading' };
}
