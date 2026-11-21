# Monitoring

## What happens when something throws

| Where the error happens                                    | Who catches it                                                                   | What the user sees                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Rendering a page                                           | React Router's `errorElement` → `RouteErrorBoundary`                             | "Something broke on our side" with **Try again** / **Back to the shop** |
| Rendering outside the router (Provider, Dev panel)         | `react-error-boundary` at the root of `App.tsx`                                  | The same fallback                                                       |
| Event handlers, timers, promises (`await` without `catch`) | `window` `error` / `unhandledrejection` listeners (`installGlobalErrorHandlers`) | Nothing breaks visibly; the error is logged                             |
| API failures                                               | Not crashes: handled by `toUserError` (D3-4)                                     | Friendly message + Retry                                                |

All of these call **`logError(error, source)`** in `src/monitoring/logger.ts`. It builds one structured report (`message`, `name`, `stack`, `source`, `componentStack`, `url`, `timestamp`), skips duplicates, and writes it to the console. In production, that one function would forward the report to an error tracker such as Sentry, with a release tag and the user id (never the token).

**Try it:** open the Mock API controls and click **Crash a page**, or visit `/debug/crash`. The fallback appears and `[bug-bazaar] error reported` shows in the console. `ErrorBoundary.test.tsx` checks the same behavior.

## Three things I would track in production

1. **Crash rate per release and route.** This means unhandled exceptions and fallback screens shown, per 1,000 sessions, split by page and app version.
   _Why:_ it's the most direct signal that a deploy broke something.
   _Alert:_ a jump after a release → roll back.

2. **Checkout funnel health.** This covers the success rate of `POST /api/orders`, plus how often it returns 409 (out of stock), 5xx and 401, and how many retries reuse an idempotency key.
   _Why:_ this is where the store makes money. A rising 409 rate means stale stock data (tune the cache or live updates). Rising 5xx or retry rates mean backend trouble; the idempotency counts prove we're _not_ double-charging.

3. **Performance as users feel it.** This means Core Web Vitals (LCP, INP, CLS) on the product list and details pages, and p95 API latency for `GET /api/products?search=`.
   _Why:_ a slow search or janky grid loses shoppers quietly, without any error ever being thrown.
   _Alert:_ INP above 200 ms, or search p95 above 1 s.
