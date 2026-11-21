# Authentication

## How it works

1. **Log in.** `LoginPage` posts `{ email, password }` to `POST /api/login` and receives `{ token, user }`.
2. **Store the session.** `dispatch(loggedIn({ token, user }))` puts it in the Redux `auth` slice. A listener middleware (`src/store/persistence.ts`) copies `{ token, user }` to `localStorage` under `bug-bazaar:auth`.
3. **Authenticate requests.** The data layer asks the store for the token on every request (`configureApiAuth({ getToken })` in `src/store/store.ts`) and sends `Authorization: Bearer <token>`.
4. **Restore on reload.** At startup, `loadAuthState()` reads and _validates_ the stored session; anything malformed means "logged out".
5. **Protect routes.** `/account`, `/checkout` and `/orders/:id` sit under `<ProtectedRoute>`. Without a token it redirects to `/login` with `state.from` set to the page you wanted, and after logging in you're sent back there. Only same-site paths (`/…`) are accepted, to prevent open redirects.
6. **Handle 401 (expired or revoked token).** `apiRequest()` sees a 401 on a request that carried a token and calls `onUnauthorized`, which dispatches `sessionExpired()`. The session is cleared in Redux and `localStorage`. Every `ProtectedRoute` re-renders and redirects to login, which explains "Your session expired".
7. **Log out.** `dispatch(loggedOut())` clears the same state.

**Double submit:** the login button is disabled while the request is in flight, and a `useRef` flag blocks a second submit even before React re-renders (a fast double-click or double Enter).

## Where the token is stored, and the trade-off

**We store the token in `localStorage`.**

| Option                                | Survives reload?         | Readable by JavaScript (XSS risk)?      | Sent automatically (CSRF risk)?  | Notes                                                    |
| ------------------------------------- | ------------------------ | --------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| **localStorage** (our choice)         | ✅                       | ❌ yes, any injected script can read it | ✅ no                            | Simple; works with our mock (MSW can't set real cookies) |
| Memory only (Redux)                   | ❌ logged out on refresh | ✅ harder to steal                      | ✅ no                            | Safest of the JS options, worst UX                       |
| sessionStorage                        | Per tab only             | ❌ yes                                  | ✅ no                            | Logged out in new tabs                                   |
| **httpOnly, Secure, SameSite cookie** | ✅                       | ✅ JavaScript can't read it             | ⚠️ needs `SameSite` / CSRF token | **Best for production**; needs a real backend            |

**Why localStorage here:** this is a demo with a mock backend. A Service Worker mock can't issue real `httpOnly` cookies, and we want login to survive a reload. The risk is XSS: if an attacker ever runs script on our page, they can read the token.

**Mitigations we rely on:**

- React escapes everything it renders.
- We never use `dangerouslySetInnerHTML`.
- The token is opaque and can be revoked server-side (the Dev panel's "Expire my session" does exactly that).

**In production** I would move to an `httpOnly; Secure; SameSite=Lax` session cookie set by the server, plus short-lived tokens. JavaScript would then never see the token at all.
