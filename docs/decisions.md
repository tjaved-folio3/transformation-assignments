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

**Request status:** `RequestState<T>` in `src/types/request.ts` is a discriminated union (`idle | loading | success | error`). Separate booleans (`isLoading`, `isError`, `data`) allow 8 combinations, most of them impossible (loading *and* error). The union allows exactly the 4 real ones, and TypeScript only lets us read `data` after checking `status === 'success'`.

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
- Converting *every* failure (HTTP error, network failure, non-JSON body) into a single `ApiRequestError` with `status`, `code` and `details`

**Avoiding a circular import:** the client needs the token from Redux, and Redux will call the client, so importing in both directions would create a loop. Instead the store "plugs in" `getToken` and `onUnauthorized` callbacks at startup with `configureApiAuth()`. This is dependency injection in its simplest form.

**Considered:**
- **axios:** interceptors would do the same job, but it's another dependency, and `fetch` plus a 90-line wrapper covers everything we need.
- **RTK Query / TanStack Query as the data layer:** discussed in D3-5.
- **Zod** for validating responses at runtime: the right choice for a real third-party API. Here we own both sides of the contract, so we trust the types and skip the extra dependency.
