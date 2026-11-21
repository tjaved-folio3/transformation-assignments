import type { ApiError } from '../types/api.ts';

/**
 * THE one place in the app that talks to the network (D1-4).
 * Components and hooks call the small functions in products.ts / auth.ts /
 * orders.ts, and those call apiRequest(). Nothing else may call fetch()
 * (an ESLint rule enforces it).
 *
 * Responsibilities:
 *  - build the URL from VITE_API_BASE_URL
 *  - send/receive JSON
 *  - attach the auth token
 *  - pass an AbortSignal through so callers can cancel
 *  - turn every failure into ONE error type: ApiRequestError
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** The single error type the rest of the app has to understand. */
export class ApiRequestError extends Error {
  /** HTTP status code, or 0 when the request never reached a server. */
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, string> | undefined;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** True when a request was cancelled on purpose with AbortController. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isApiError(payload: unknown): payload is ApiError {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'code' in payload.error &&
    typeof payload.error.code === 'string'
  );
}

/**
 * The data layer must not import the Redux store (that would make a circular
 * import: store → api → store). Instead the app "plugs in" these two
 * functions at startup (see src/store/store.ts).
 */
type AuthHooks = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

let authHooks: AuthHooks = { getToken: () => null, onUnauthorized: () => {} };

export function configureApiAuth(hooks: AuthHooks) {
  authHooks = hooks;
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null; // e.g. an HTML error page from a proxy
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, headers: extraHeaders } = options;
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  const headers = new Headers({ Accept: 'application/json', ...extraHeaders });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = authHooks.getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // Cancelled on purpose: let the caller see it and ignore it.
    if (isAbortError(error)) throw error;
    // Offline, DNS failure, CORS…: the server never answered.
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'The request could not reach the server');
  }

  const payload = await readJson(response);

  if (!response.ok) {
    // A 401 on a request that carried a token means the session is no longer valid.
    if (response.status === 401 && token) authHooks.onUnauthorized();
    if (isApiError(payload)) {
      const { code, message, details } = payload.error;
      throw new ApiRequestError(response.status, code, message, details);
    }
    throw new ApiRequestError(response.status, 'UNKNOWN_ERROR', `Request failed with status ${response.status}`);
  }

  // We trust the server to follow the contract. A runtime schema library
  // (e.g. Zod) could validate here; see docs/decisions.md.
  return payload as T;
}
