# Decisions

Each task records what we chose, what else we considered, and why.

---

## D0: Which repository to build on

**Choice:** Build The Bug Bazaar in this repository (`transformation-assignments`), on a new branch `feature/bug-bazaar`, keeping all existing history.

**Considered:**

- Starting from the Week 1 `bug-bounty-starter` folder.
- Creating a new repository.

**Why:** The Week 1 Bug Bounty Board was not built. The starter only contains an empty `App` component and a three-item mock, so there is no feature code to carry over. The evaluator asked us to continue in the same repository rather than create a new one, so this repo (already on GitHub with history) is the base. The concepts from the Week 1 missions (loading and error states, derived values, controlled forms, immutable updates, a not-found route) are all covered again in the Bug Bazaar tasks.

**Branching:** All week's work goes on `feature/bug-bazaar`, pushed daily, with one pull request into `main` at the end of the week.

---

## D1-3: TypeScript in strict mode

**Choice:** TypeScript 6 with `strict: true`, plus `erasableSyntaxOnly` (bans `enum`, `namespace` and constructor parameter properties, so every TS feature we use is "types only" and disappears at build time) and `verbatimModuleSyntax` (type-only imports must say `import type`). ESLint fails the build on `any` and `@ts-ignore`.

**Contract types:** `src/types/api.ts` mirrors the shared contract. Union types such as `Category` are derived from `as const` arrays, so the list we loop over in the UI and the type can never drift apart.

**Request status:** `RequestState<T>` in `src/types/request.ts` is a discriminated union (`idle | loading | success | error`). Separate booleans (`isLoading`, `isError`, `data`) allow 8 combinations, most of them impossible (loading _and_ error). The union allows exactly the 4 real ones, and TypeScript only lets us read `data` after checking `status === 'success'`.

**Considered:** TypeScript 7 (the new native compiler) was released, but `typescript-eslint` only supports up to 6.0, so we stay on 6. Looser settings (`strict: false`) would make migration faster but hide the bugs strict mode exists to catch.

---

## D1-2: Mocking the API

**Choice:** [MSW](https://mswjs.io) (Mock Service Worker). In the browser, a Service Worker intercepts real `fetch` calls; in tests, `msw/node` does the same inside Node. The app's code is identical to what it would be with a real backend: switching to one is just `VITE_ENABLE_MOCKS=false` plus `VITE_API_BASE_URL`.

**Seed data:** a seeded random generator, so the 5,000 products are identical everywhere (reproducible links, tests and bug reports).

**Triggering errors:** a Dev panel writes "scenarios" to `localStorage`, and handlers check them on every request. We considered `?mock=500` URL flags, but they get lost when navigating between pages, and a panel is easier to demo.

**Considered:**

- **json-server:** a real HTTP server, but it needs a second process, and custom logic (409, idempotency, auth) is awkward.
- **Fake functions** (like the Week 1 `mockApi.js`): simplest, but they skip HTTP entirely. Status codes, headers and `fetch` errors would never be exercised, so the data layer would be untested.

**Trade-off:** the MSW worker adds ~160 kB to the bundle. It's loaded with a dynamic `import()` only when mocks are on, so a real deployment would not ship it.

---

## D1-4: One place for all requests

**Choice:** `src/api/client.ts` exports `apiRequest()`, the only function that calls `fetch`. Small per-resource modules (`products.ts`, `auth.ts`, `orders.ts`) wrap it with typed functions such as `fetchProduct(id, signal)`. An ESLint `no-restricted-globals` rule fails the build if `fetch` appears anywhere else, so the rule doesn't depend on people remembering it.

**What the client handles once, for everyone:**

- The base URL
- JSON encoding and decoding
- The `Authorization` header
- `AbortSignal` support, so callers can cancel requests
- Converting _every_ failure (HTTP error, network failure, non-JSON body) into a single `ApiRequestError` with `status`, `code` and `details`

**Avoiding a circular import:** the client needs the token from Redux, and Redux will call the client, so importing in both directions would create a loop. Instead the store "plugs in" `getToken` and `onUnauthorized` callbacks at startup with `configureApiAuth()`. This is dependency injection in its simplest form.

**Considered:**

- **axios:** interceptors would do the same job, but it's another dependency, and `fetch` plus a 90-line wrapper covers everything we need.
- **RTK Query / TanStack Query as the data layer:** discussed in D3-5.
- **Zod** for validating responses at runtime: the right choice for a real third-party API. Here we own both sides of the contract, so we trust the types and skip the extra dependency.

---

## D1-1: Project setup

**Choice:**

- **Prettier** owns formatting: single quotes, 120-column lines, LF line endings. `eslint-config-prettier` switches off ESLint's style rules so the two tools never disagree.
- **ESLint** owns correctness: TypeScript rules and React Hooks rules.
- **`.editorconfig`** gives every editor the same indentation and line endings, which matters on Windows.
- **`.nvmrc` plus `engines`** pin Node 22.12+, the minimum for Vite 8 and Vitest 5.
- **Folders by layer, then by feature:** `api/`, `mocks/`, `types/` and `store/` are shared layers; `features/<name>/` keeps a feature's page and components together.
- **`npm run check`** runs everything CI will run, so you can catch failures locally first.

**Considered:**

- **Biome:** one fast tool for both lint and format, but it doesn't yet support the React Hooks rules we rely on.
- **Husky pre-commit hooks:** useful, but extra setup for a one-week project; CI (D4-6) enforces the same checks.
- **Grouping only by file type** (all components in one folder): simpler at first, but features get scattered across folders as the app grows.

**Verified:** a fresh copy ran `npm ci`, then `npm run check`, then `npm run build` in about 15 seconds (most of the 5-minute budget is downloading packages).

---

## D2-1: Product list and details

**Choice:**

- **React Router** (library mode) with `createBrowserRouter`, so all routes live in one object in `src/router.tsx`.
- **A shared `<Layout>`** renders the header and footer, and React Router fills in its `<Outlet />` with the current page.
- **Real links for cards:** each `ProductCard` is one `<Link>` (a real `<a>`), so Tab and Enter work for free.
- **Prices:** stored as integer cents and formatted only at display time with one reused `Intl.NumberFormat`, which gives `$1,234.56` with correct separators.
- **Fetching:** a first version of the `useApiQuery` hook. It stores the `key` with each result, so a result is only shown for the key it was loaded for.

**Considered:**

- **TanStack Router:** fully typed routes, but more to learn this week.
- **Floats for money:** rejected, because `0.1 + 0.2 = 0.30000000000000004`.
- **`toFixed(2)` for prices:** rejected, because it doesn't add the `$` sign or thousands separators.
- **`onClick` on a `<div>` card:** rejected, because keyboards and screen readers can't use it.

---

## D2-2: Filters live in the URL

**Choice:** the URL query string (`?q=&category=&inStock=&sort=&page=`) is the **only** place filter state lives. `useProductFilters()` reads it with React Router's `useSearchParams` and writes changes back. Pure functions in `productFilters.ts` convert URL ⇄ typed object and replace invalid values (`?page=-3`, `?category=hats`) with defaults.

**History rules:**

- **Typing in search** uses `replace: true`, so "d-u-c-k" doesn't create 4 Back-button steps.
- **Choosing a category, sort, checkbox or page** pushes a new entry, so Back undoes it.
- **Changing any filter** resets to page 1.
- **Pagination uses real links**, so each page can be opened in a new tab or shared.

**Considered:**

- **`useState` in the page:** lost on refresh, can't be shared, and Back leaves the page entirely.
- **Redux:** same problems. Global state is not the same as shareable state.
- **localStorage:** survives refresh, but a copied link wouldn't reproduce the view.

---

## D2-3: Loading, empty, error and success states

**Choice:** three shared components in `src/components/StatusViews.tsx` (`LoadingState`, `EmptyState`, `ErrorState`), used by every page, so the states look and behave the same everywhere. Pages `switch` on `state.status` from the `RequestState` union. Because the switch must handle every case, TypeScript reminds us if a state is forgotten.

- **Loading:** skeletons shaped like the content, so the layout doesn't jump. Marked `role="status"` with hidden text for screen readers, and the shimmer stops for users who prefer reduced motion.
- **Empty:** two different cases. "No products match" offers _Clear filters_; "There is no page 999" offers _Go to page 1_.
- **Error:** friendly copy only (never the raw server message) and a **Try again** button. `useApiQuery` exposes `refetch()`, which bumps an `attempt` counter that is part of the request's identity, so the UI shows "loading" immediately and then re-requests.
- **404 on details** renders the Not Found page instead of a generic error.

**How to trigger each state:** Mock API controls → "Product list → 500" (error), "Slow" network (loading), search for `zzzz` (empty), `/?page=999`, `/products/p-9999` (404).

**Considered:** a spinner instead of skeletons. Simpler, but the page jumps when content arrives, and skeletons feel faster.

---

## D2-4: Cleaning up effects

**Choice:** every `useEffect` that starts something returns a cleanup function that stops it. React runs that cleanup before re-running the effect and when the component unmounts.

- **Requests:** `useApiQuery` creates an `AbortController` per run and calls `abort()` in cleanup. Switching from p-0001 to p-0002 cancels p-0001's request at the network level, so its late response can't overwrite p-0002. As a second guard, results are only stored when the signal is not aborted.
- **Listeners:** `BackToTop` adds a passive `scroll` listener on mount and removes it on unmount.

**The bug this fixed:** before this task, a slow old response arriving after a fast new one replaced the new result. The page then showed "loading" forever (or, without our key check, the wrong product). Reproduce it: choose the "Random" network speed and click "Next product →" quickly 8 times; the final page always matches the URL. `useApiQuery.test.ts` proves it by resolving responses in reverse order.

**Considered:** an `ignore` flag (`let ignore = false; return () => { ignore = true }`). It prevents the stale update, but the request keeps running and using bandwidth. `AbortController` actually cancels it, and we still check `signal.aborted` before updating state.

---

## D2-5: Custom hooks

**Choice:** reusable, typed hooks in `src/hooks/`, each replacing logic that was (or would be) copied between components:

| Hook                           | What it does                                                       | Used by                                                                                   |
| ------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `useApiQuery(key, fetcher)`    | Loading/error/success state, abort on change/unmount, retry        | Product list, product details (Day 3: account, order pages)                               |
| `useDebouncedValue(value, ms)` | Delays a fast-changing value                                       | Search box: 1 request for "keyboard" instead of 8                                         |
| `useScrolledPast(px)`          | Scroll listener with cleanup                                       | Back to Top button **and** the header shadow (previously two copies of the same listener) |
| `useLocalStorage(key, parse)`  | `useState` that persists, validates stored data, syncs across tabs | Mock API controls panel (replaced hand-written read/parse/save code)                      |
| `useProductFilters()`          | Typed filters read from and written to the URL                     | Product list page                                                                         |

**Design rules:**

- Hooks hide _how_ (listeners, timers, AbortControllers) and expose _what_ (a value and maybe a setter).
- Each hook owns its own cleanup.
- `useLocalStorage` takes a `parse` function rather than trusting `JSON.parse`, because storage can hold old or corrupted data.

**Considered:**

- **`useSyncExternalStore` for scroll position:** React's official way to subscribe to browser APIs, and a good fit. We kept `useEffect` because it shows the cleanup pattern more clearly.
- **A debounce library** (`lodash.debounce`): unnecessary for 8 lines.

---

## D2-6: Race conditions in search

**Problem:** responses don't always come back in the order requests were sent. If "du" is slow and "duck" is fast, a naïve app shows "duck" results and is then overwritten by the stale "du" results.

**Simulating it:**

- **In the browser:** Mock API controls → **Network speed: Random**. Every response takes a random 100–2000 ms, so they arrive out of order.
- **In tests:** `ProductListPage.race.test.tsx` makes the old query slow (300 ms) and the new one fast (20 ms) on purpose.

**Defense in three layers:**

1. **Debounce** (`useDebouncedValue`, 300 ms) means far fewer requests in flight to begin with. This reduces the problem; it doesn't solve it.
2. **Abort** (`useApiQuery` cleanup) means that when the query key changes, the previous request is cancelled, so its response never arrives.
3. **Key check:** a result is only shown if it was stored for the _current_ key and attempt. Even if a stale response somehow got through, it wouldn't be displayed.

**Proof the tests catch it:** with the abort cleanup temporarily removed, the race test and 3 hook tests fail; with it restored, they pass.

**Considered:**

- **A request counter** ("only accept response #N if N is the latest"): works, but doesn't cancel the network request.
- **RxJS `switchMap`:** the same idea, but too heavy a dependency for this.

---

## D3-1: Redux Toolkit for cart and session

**Choice:** a single Redux Toolkit store (`src/store/`) with two slices:

- **`cart`:** `itemAdded`, `quantityChanged`, `itemRemoved`, `stockUpdated`, `cartCleared`.
- **`auth`:** `loggedIn`, `userLoaded`, `loggedOut`, `sessionExpired`.

State changes **only** by dispatching these actions. Reducers enforce the rules in one place (e.g. quantity is always clamped to `1..stock`), so no component can put the cart into an invalid state.

**Derived values:** `selectCartCount` and `selectCartTotal` are memoized selectors (`createSelector`) computed from `items`. The header badge reads `selectCartCount`. Storing a `count` field would mean every reducer has to keep it in sync, and one day it wouldn't.

**What goes where (the three kinds of state):**

| State            | Where                        | Why                                                                    |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Cart, session    | Redux (client state)         | Shared by many components across pages; changes through defined events |
| Products, orders | `useApiQuery` (server state) | The server owns it; we cache a copy, we don't own it                   |
| Filters, page    | URL                          | Must survive refresh and be shareable                                  |

**Considered:**

- **React Context + `useReducer`:** fine for small apps, but every consumer re-renders on any change, and there are no DevTools.
- **Zustand:** less boilerplate, but the brief's topic is Redux Toolkit.
- **Putting products in Redux:** it would make Redux a hand-rolled cache. That's RTK Query's job (see D3-5).

---

## D3-3: Authentication

**Choice:**

- **Session in Redux** (`auth` slice), persisted to `localStorage` by a listener middleware. Reducers stay pure; side effects happen in the listener.
- **`<ProtectedRoute>`** is a layout route that renders `<Outlet />` when signed in and otherwise `<Navigate to="/login" state={{ from }} />`.
- **Any 401** on an authenticated request dispatches `sessionExpired()` from the data layer, so the session is cleared in exactly one place.

Full details and the token-storage trade-off are in [`docs/auth.md`](auth.md).

**Considered:**

- **React Router loaders** (`redirect()` inside a loader): powerful, but they would mix data loading into routing.
- **A wrapper component per page:** too easy to forget on a new page.
- **Checking auth inside each page:** duplicated logic.

---

## D3-2: Cart and checkout

**Choice:**

- **Cart rules live in the reducer.** Quantities are clamped to `1..stock` in one function, so neither the cart page buttons nor "Add to cart" can exceed stock, and a `stockUpdated` action caps existing lines.
- **Persistence:** a listener middleware saves the cart to `localStorage` after every cart action. At startup each saved line is _validated_, and invalid lines are dropped rather than trusted.
- **Idempotent checkout:** each checkout attempt gets a UUID `Idempotency-Key`, stored in `sessionStorage` together with a signature of the cart contents (`p-0001x2,p-0004x1`).
  - **Retry** (button, or after a reload) → same cart → same key → the server returns the original order. No duplicate.
  - **Cart changed** (e.g. after a 409) → new signature → new key, because it's genuinely a different order.
  - **Success** → the key is cleared.
- **Double-click guard:** a `useRef` flag, plus a disabled button.
- **409:** we re-fetch the stock of each product id in `error.details`, dispatch `stockUpdated`, and name each product in the message. Checkout stays disabled while an out-of-stock line remains.
- **Navigation order bug found by a test:** clearing the cart before navigating re-rendered checkout with an empty cart, and its guard redirected to `/cart`. Fix: `navigate(..., { flushSync: true })` first, _then_ `cartCleared()`.
- **Order confirmation** polls `GET /orders/:id` every 1.5 s until `confirmed`. The cleanup aborts the request and clears the timer.

**Considered:**

- **Disabling the button only:** this doesn't cover a timeout followed by a reload, or a response lost on the network. The server must dedupe, which is what idempotency keys are for.
- **Generating the key on the server:** a client-generated key is the standard approach (as with Stripe), because the client is the one that retries.
