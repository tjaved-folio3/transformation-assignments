# AI notes

I used Claude (an AI assistant) throughout this project, as a pair programmer and tutor. I asked it to plan the work, build one task at a time, explain each file and concept, and verify every task before committing. Below are three notable uses, one mistake it made and how it was caught, and one thing I wouldn't hand to AI.

## Use 1: Planning the week

**Prompt (summary):** "Review the requirements and my repository. Break the work into tasks with dependencies, edge cases and acceptance criteria, and make a day-by-day plan. Don't build everything at once; explain each step."

**What I kept:**

- The task breakdown: 31 scored tasks and about 107 subtasks.
- The build order inside Day 1: TypeScript → mock API → data layer → README, so everything after it was typed.
- The finding that my repo was only a Vite starter and the Week 1 Bug Bounty Board was never built. That's recorded in `decisions.md` (D0).

**What I changed and why:** I only had two days left instead of six, so we compressed the plan and kept the brief's priority order (Days 1–3 first). I also chose **hand-written hooks plus a small cache** over RTK Query. I wanted to understand abort, race conditions and caching well enough to explain them, rather than have a library hide them.

## Use 2: Effect cleanup and the out-of-order bug (D2-1 → D2-4)

**Prompt (summary):** "Build the product details page; then make switching products quickly never show the wrong one, and stop everything when the page closes."

**What I kept:**

- The `useApiQuery` design that stores each result next to its `key`.
- `AbortController` in the effect cleanup.
- `useEffectEvent`, so the effect doesn't re-run on every render.

**What I changed and why:** the first version (D2-1) had no cleanup, and a slow old response could overwrite a newer one. We kept that version on purpose for one commit, so the D2-4 fix tells a clear before/after story. I also asked for proof that the tests really catch the bug: we temporarily removed the abort, **4 tests failed**, and we put it back.

## Use 3: Idempotent checkout (D3-2)

**Prompt (summary):** "Let users check out, show a 409 that names the item, and make sure retrying can't create a second order."

**What I kept:** an idempotency key tied to a _signature of the cart contents_ and stored in `sessionStorage`. The same cart gets the same key, even after a reload; a changed cart gets a new key.

**What I changed and why:** the "force 409" mock scenario originally said "out of stock" without changing the stock. Re-fetching the product then showed it still had stock, so the message didn't make sense. I changed the scenario to actually set that product's stock to 0 ("another shopper just bought it"), which matches real life.

## An AI mistake, and how it was caught

After a successful order, the AI's checkout code did `dispatch(cartCleared())` and _then_ `navigate('/orders/…')`. Clearing the cart re-rendered the checkout page with an empty cart, and its own "empty cart → go to /cart" guard fired. So instead of the order confirmation, the user landed on the empty cart page.

**How it was caught:** the checkout test ("places an order, clears the cart and shows the confirmation") **failed**. The test output showed "Cart page" where "Order confirmation" was expected.

**Fix:** navigate first with `flushSync: true`, which commits the new page immediately, _then_ clear the cart. A second, smaller mistake surfaced while fixing it: switching the import to `react-router/dom` made Vitest load two copies of React Router, and 7 tests failed. We went back to `react-router` and passed `flushSync` to `RouterProvider` explicitly.

**Lesson:** AI code that _looks_ right still needs tests that check what the user actually sees.

## What I wouldn't hand to AI

**Security decisions and their trade-offs**, such as where the auth token lives in production, what goes into error logs, and how payments are protected from double charges. AI is good at listing the options (I used it for `docs/auth.md`), but the decision depends on our real backend, our threat model and our users, and I'm the one accountable if it's wrong. I'd also never paste real secrets, tokens or customer data into a prompt.
