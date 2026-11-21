import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../test/server.ts';
import { fetchProduct } from './products.ts';
import { fetchMe } from './auth.ts';
import { ApiRequestError, configureApiAuth } from './client.ts';

describe('apiRequest (data layer)', () => {
  it('turns an ApiError response into an ApiRequestError with status and code', async () => {
    const error = await fetchProduct('p-9999').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('reports a network failure as status 0 instead of crashing', async () => {
    server.use(http.get('/api/products/:id', () => HttpResponse.error()));
    await expect(fetchProduct('p-0001')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('sends the token and calls onUnauthorized when a signed-in request gets a 401', async () => {
    const onUnauthorized = vi.fn();
    configureApiAuth({ getToken: () => 'expired-token', onUnauthorized });
    await expect(fetchMe()).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    configureApiAuth({ getToken: () => null, onUnauthorized: () => {} });
  });
});
