# Glossary

Each term in plain words, with where it shows up in The Bug Bazaar.

## Latency

The time between asking for something and getting the answer: how long a request takes to travel to the server, be processed, and come back.

**In the store:** the mock API waits 200–400 ms by default. Choosing **Slow** (2 s) in the Dev panel makes latency visible, and the skeletons appear. **Random** latency (100 ms–2 s) is what makes responses arrive _out of order_, which is why D2-6 needed abort plus key checks. Debouncing the search box hides latency by sending one request instead of eight.

## Idempotency

An operation is idempotent if doing it twice has the same effect as doing it once. Pressing an elevator button five times still calls one elevator.

**In the store:** `POST /api/orders` is normally _not_ idempotent: each call would create a new order. Sending an `Idempotency-Key` header makes it idempotent. The server remembers which order each key created, so a retry after a timeout returns the **same** order instead of charging the shopper twice (D3-2, `docs/orders.md`).

## Horizontal scaling

Handling more load by adding **more machines** running the same code, behind a load balancer, instead of buying one bigger machine (_vertical_ scaling). It only works if the servers don't keep important data in their own memory, so any server can handle any request.

**In the store:** on a sale day you'd run 10 copies of the order service and 20 payment workers reading from the same queue. Because the session token is sent with every request (rather than kept in one server's memory) and orders live in a shared database, any copy can serve any shopper.

## CDN (Content Delivery Network)

A network of servers around the world that keep copies of your static files (JS, CSS, images) close to users, so they download from a nearby city instead of from your origin server across the ocean. That's lower latency, and less load on your server.

**In the store:** `npm run build` produces `dist/` with hashed file names like `index-RAkPkFeK.js`. A CDN (GitHub Pages is served from one) can cache those **forever**, because a code change produces a new file name. Only `index.html` needs a short cache time. The four product images would also come from the CDN.

## Cache invalidation

Removing or refreshing cached data when the real data changes, so users don't keep seeing old values. Famously one of the hard problems in computing, because you must know _everything_ a change affects.

**In the store:** product lists and details are cached for 30 s (D3-5). Placing an order changes stock, so checkout calls `queryCache.invalidate('products', 'product:')`, and the next view refetches. Logging in or out invalidates `me`, so one user's data never shows for another. "Try again" invalidates its own key so the retry really reaches the server.

## Eventual consistency

Different parts of a system may briefly disagree, but if no new changes happen, they **all end up agreeing**. You trade "always instantly correct everywhere" for speed and availability.

**In the store:**

- **Orders:** an order is `queued`, then `processing`, then `confirmed`. Right after checkout the order exists but isn't paid yet, and the page polls until it settles.
- **Stock:** a product page you loaded 20 seconds ago may say "3 left" while the database says 1. The WebSocket push or the next refetch brings it back in line, and checkout's 409 catches the gap.
- **Email:** if the email service is down, the confirmation email arrives late, but it does arrive.
