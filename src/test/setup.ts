import { afterAll, afterEach, beforeAll } from 'vitest';
import { db } from '../mocks/db.ts';
import { server } from './server.ts';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  db.reset();
});
afterAll(() => server.close());
