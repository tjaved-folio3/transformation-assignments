import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers.ts';

/** The same mock API the browser uses, running inside Node for tests. */
export const server = setupServer(...handlers);
