import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { dropLiveStockConnections, liveConnectionCount } from '../mocks/liveStock.ts';
import { useLiveStock } from './useLiveStock.ts';

describe('useLiveStock (D4-4)', () => {
  it('receives pushed stock updates, recovers after a disconnect, and closes on unmount', async () => {
    const onUpdate = vi.fn();
    const { result, unmount } = renderHook(() => useLiveStock(['p-0001'], onUpdate));

    // 1. Connects and receives live updates for the subscribed product.
    await waitFor(() => expect(result.current.status).toBe('live'));
    await waitFor(() => expect(result.current.stockById['p-0001']).toEqual(expect.any(Number)));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p-0001' }));

    // 2. The server drops the connection: the hook reconnects by itself (1 s backoff).
    dropLiveStockConnections();
    await waitFor(() => expect(result.current.status).toBe('reconnecting'));
    await waitFor(() => expect(result.current.status).toBe('live'), { timeout: 3000 });

    // 3. Leaving the page closes the socket: nothing keeps running.
    unmount();
    await waitFor(() => expect(liveConnectionCount()).toBe(0));
  });
});
