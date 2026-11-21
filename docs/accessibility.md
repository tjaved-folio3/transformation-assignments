# Accessibility

## Lighthouse (accessibility category)

Measured on the production build (`npm run build && npm run preview`) with Lighthouse 12, headless Chrome:

| Page             | Before D4-1                                      | After D4-1 |
| ---------------- | ------------------------------------------------ | ---------- |
| Home (`/`)       | 98: heading order skipped from `h1` to card `h3` | **100**    |
| Cart (`/cart`)   | 100                                              | **100**    |
| Login (`/login`) | 100                                              | **100**    |

Re-run: `npx lighthouse http://localhost:4173/ --only-categories=accessibility --view`, or Chrome DevTools → Lighthouse → Accessibility.

## What makes it work

**Keyboard**

- A "Skip to content" link is the first Tab stop.
- Every control is a real `<a>`, `<button>`, `<input>` or `<select>`, so Tab, Enter and Space work natively (no clickable `<div>`s).
- There's a visible `:focus-visible` ring on everything.
- After each page change, focus moves to `<main>` (`RouteFocus`), so the next Tab starts in the new content instead of on the old link.
- Back to Top also returns focus to the top.

**Screen readers**

- **Landmarks and titles:** `header`, `nav` (labelled), `main`, `footer`, and a unique `document.title` per page (`useDocumentTitle`).
- **Headings:** one `h1` per page, with card titles as `h2`.
- **Images:** decorative product images use `alt=""` because the name is right next to them. Icon-only text (emoji) is `aria-hidden`.
- **Labels:** inputs have `<label for>`. The cart −/+ buttons have names like "Increase quantity of Zen Rubber Duck". The cart badge reads "Cart, 3 items".
- **Live regions:** the result count is `aria-live="polite"`, so "128 products" is announced after filtering. Loading uses `role="status"`; errors use `role="alert"`; "Added to cart" uses `role="status"`.
- **Form errors are announced:** invalid fields get `aria-invalid` and `aria-describedby` pointing at their error text. On submit, focus moves to the first invalid field, so the reader says its label _and_ its error. Form-level errors (wrong password, checkout problems) are `role="alert"`.

**Visual**

- Text colors meet WCAG AA contrast (muted text is 6.6:1 on white; button text 6.3:1).
- Touch targets are at least 44 px.
- Animations (skeleton shimmer, smooth scroll, card hover) are switched off under `prefers-reduced-motion`.
