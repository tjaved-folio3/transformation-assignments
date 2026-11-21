import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.ts';
import { liveStockHandler } from './liveStock.ts';

/** The Service Worker that intercepts fetch() calls in the browser. */
export const worker = setupWorker(...handlers, liveStockHandler);
