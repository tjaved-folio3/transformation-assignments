import { ApiRequestError, isAbortError } from './client.ts';

/**
 * D3-4: ONE place that decides what an error means for the user.
 *
 * Every caught error goes through toUserError(), which returns a typed
 * description. Components switch on `kind` and never render
 * `error.message` from the server: those are written for developers
 * ("Simulated server failure", stack traces, SQL errors…), not shoppers.
 *
 *   400 → 'validation'    field errors next to the inputs
 *   401 → 'unauthorized'  session cleared (by the data layer), redirect to login
 *   404 → 'not-found'     Not Found page
 *   409 → 'conflict'      out-of-stock message naming the item
 *   500 → 'server'        friendly message + Retry
 *   0   → 'network'       "check your connection" + Retry
 */
export type UserError =
  | { kind: 'validation'; message: string; fieldErrors: Record<string, string> }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'not-found'; message: string }
  | { kind: 'conflict'; message: string; productIds: string[] }
  | { kind: 'server'; message: string; retryable: true }
  | { kind: 'network'; message: string; retryable: true }
  | { kind: 'cancelled' };

export function toUserError(error: unknown): UserError {
  if (isAbortError(error)) return { kind: 'cancelled' };

  if (error instanceof ApiRequestError) {
    switch (error.status) {
      case 0:
        return {
          kind: 'network',
          message: "We couldn't reach the store. Check your connection and try again.",
          retryable: true,
        };
      case 400:
        return {
          kind: 'validation',
          message: 'Please check the highlighted fields.',
          // Field messages in `details` are written for users by the API contract.
          fieldErrors: error.details ?? {},
        };
      case 401:
        return { kind: 'unauthorized', message: 'Your session expired. Please log in again.' };
      case 404:
        return { kind: 'not-found', message: "We couldn't find what you were looking for." };
      case 409:
        return {
          kind: 'conflict',
          message: 'Some items in your cart are no longer available in that quantity.',
          productIds: Object.keys(error.details ?? {}),
        };
    }
  }

  // 500s, unexpected statuses and plain JS errors all look the same to a shopper.
  return { kind: 'server', message: 'Something went wrong on our side. Please try again.', retryable: true };
}
