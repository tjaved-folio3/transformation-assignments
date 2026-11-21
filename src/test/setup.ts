import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { queryCache } from '../api/cache.ts';
import { db } from '../mocks/db.ts';
import { server } from './server.ts';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup(); // unmount whatever the test rendered
  server.resetHandlers();
  localStorage.clear();
  db.reset();
  queryCache.clear();
});
afterAll(() => server.close());
