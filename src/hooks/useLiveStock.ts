import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  connectLiveStock,
  type LiveStockConnection,
  type LiveStockMessage,
  type LiveStockStatus,
} from '../api/liveStock.ts';

/**
 * Live stock for the given products: returns the latest pushed stock per id
 * (missing = no update yet, use the value from the API) and the connection status.
 *
 * Two effects with different lifetimes:
 *  1. connect once on mount, close on unmount (the socket stops when the page closes)
 *  2. update the subscription whenever the visible products change (no reconnect)
 */
export function useLiveStock(productIds: string[], onUpdate?: (message: LiveStockMessage) => void) {
  const [stockById, setStockById] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<LiveStockStatus>('connecting');
  const connectionRef = useRef<LiveStockConnection | null>(null);
  const handleUpdate = useEffectEvent((message: LiveStockMessage) => onUpdate?.(message));
  const idsKey = productIds.join(',');

  useEffect(() => {
    const connection = connectLiveStock({
      onStock: (message) => {
        setStockById((previous) => ({ ...previous, [message.productId]: message.stock }));
        handleUpdate(message);
      },
      onStatus: setStatus,
    });
    connectionRef.current = connection;
    return () => {
      connection.close();
      connectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    connectionRef.current?.subscribe(idsKey ? idsKey.split(',') : []);
  }, [idsKey]);

  return { stockById, status };
}
