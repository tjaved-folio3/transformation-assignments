# Reflection

How well I understand each topic now, out of 10. 10 means "I could teach it and build it again without help"; 5 means "I can explain what our code does, but I'd need help building it from scratch".

> **Draft:** these ratings are a starting point. I'll adjust them honestly before submitting.

| Topic                        | Rating | Notes                                                                               |
| ---------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Setup (tooling, README)      | 8/10   | Prettier vs ESLint roles, scripts, env vars                                         |
| HTTP and API contracts       | 7/10   | Status codes and error shapes are clear; designing a contract from scratch is newer |
| TypeScript                   | 6/10   | Strict mode, unions, `as const`, type guards; generics still feel tricky            |
| Data layer                   | 7/10   | Why one `apiRequest`; dependency injection for the token                            |
| Product list                 | 8/10   | Keys, links vs buttons, prices in cents                                             |
| Filters (URL state)          | 8/10   | `useSearchParams`, push vs replace                                                  |
| UI states                    | 8/10   | Discriminated union → switch                                                        |
| useEffect and cleanup        | 7/10   | Cleanup on dependency change and unmount; StrictMode double-run                     |
| Custom hooks                 | 7/10   | Can write simple ones; `useEffectEvent` is new to me                                |
| Race conditions              | 7/10   | Debounce + abort + key check                                                        |
| Redux Toolkit                | 6/10   | Slices, actions, selectors; middleware is newer                                     |
| Cart and checkout            | 7/10   | Clamping, persistence, idempotency keys                                             |
| Auth                         | 6/10   | Protected routes, 401 flow; token storage trade-offs                                |
| Backend errors               | 7/10   | One mapping function, never raw messages                                            |
| Caching                      | 6/10   | Fresh/stale/invalidate; when stale is OK                                            |
| Accessibility                | 6/10   | Landmarks, labels, live regions, focus management                                   |
| Performance                  | 6/10   | Measure first; Profiler; long tasks                                                 |
| Memoization / virtualization | 6/10   | When `memo` helps and when it doesn't                                               |
| WebSockets                   | 5/10   | Can explain the upgrade and reconnect; haven't built a real server                  |
| Testing                      | 6/10   | RTL queries by role, MSW in tests; async `act`/`waitFor` still confusing            |
| Git / CI / CD                | 6/10   | Workflow steps, branch protection                                                   |
| Monitoring                   | 6/10   | Error boundaries, what to track                                                     |
| Architecture                 | 6/10   | State locations, dependency direction                                               |
| Design patterns              | 6/10   | Container/presentational, hooks, adapter                                            |
| Queues / microservices       | 5/10   | Concepts clear, no hands-on experience                                              |
| Architecture vocabulary      | 6/10   |                                                                                     |
| Architecture review          | —      | Done with my review partner on Day 5                                                |
| Code review                  | —      | Done with my review partner on Day 5                                                |
| AI workflow                  | 7/10   | Ask for explanations and tests, verify everything                                   |
| Assessment                   | 7/10   |                                                                                     |
| Submission                   | 7/10   |                                                                                     |

## Two gaps and my next step for each

1. **Writing async tests on my own** (`act`, `waitFor`, `findBy…`, fake timers).
   **Next step:** without AI, write three new tests for the cart page (change quantity, remove, out-of-stock line blocks checkout), and get them green by reading the Testing Library docs on async utilities.

2. **The backend side of real-time and queues** (WebSocket servers, message queues).
   **Next step:** build a tiny Node.js server with the `ws` package that pushes stock changes, and point `VITE_LIVE_STOCK_URL` at it instead of the MSW mock, to see the real handshake in the DevTools Network tab.
