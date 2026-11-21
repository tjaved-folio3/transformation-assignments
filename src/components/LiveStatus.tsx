import type { LiveStockStatus } from '../api/liveStock.ts';

const LABELS: Record<LiveStockStatus, string> = {
  connecting: 'Connecting to live stock…',
  live: 'Live stock',
  reconnecting: 'Reconnecting live stock…',
};

export function LiveStatus({ status }: { status: LiveStockStatus }) {
  return <span className={`live-status live-status--${status}`}>{LABELS[status]}</span>;
}
