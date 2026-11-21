import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './client.ts';
import { toUserError } from './errors.ts';

describe('toUserError', () => {
  it('maps each status to a kind with a friendly message, never the raw server message', () => {
    const raw = 'SELECT * FROM products failed: connection refused';
    const cases = [
      [400, 'validation'],
      [401, 'unauthorized'],
      [404, 'not-found'],
      [409, 'conflict'],
      [500, 'server'],
      [0, 'network'],
    ] as const;
    for (const [status, kind] of cases) {
      const result = toUserError(new ApiRequestError(status, 'X', raw));
      expect(result.kind).toBe(kind);
      expect(JSON.stringify(result)).not.toContain(raw);
    }
  });

  it('keeps 400 field errors and 409 product ids', () => {
    expect(toUserError(new ApiRequestError(400, 'V', 'x', { email: 'Enter a valid email' }))).toMatchObject({
      fieldErrors: { email: 'Enter a valid email' },
    });
    expect(toUserError(new ApiRequestError(409, 'O', 'x', { 'p-0001': 'gone' }))).toMatchObject({
      productIds: ['p-0001'],
    });
  });

  it('treats unknown thrown values as a retryable server error', () => {
    expect(toUserError(new TypeError('undefined is not a function'))).toMatchObject({
      kind: 'server',
      retryable: true,
    });
  });
});
