import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers.ts';
import { liveStockHandler } from '../mocks/liveStock.ts';

/** The same mock API the browser uses, running inside Node for tests. */
export const server = setupServer(...handlers, liveStockHandler);
