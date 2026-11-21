# API contract

The shared contract every part of The Bug Bazaar builds against. The app runs without a real backend: [MSW](https://mswjs.io) (Mock Service Worker) intercepts `fetch` calls and answers them from `src/mocks/handlers.ts`. The TypeScript types live in `src/types/api.ts`.

- **Base URL:** `/api` (override with `VITE_API_BASE_URL`)
- **Money:** every price is an integer number of **cents** (`1999` = $19.99)
- **Errors:** every non-2xx response has the `ApiError` shape below

```ts
type Product = {
  id: string; // "p-0001" … "p-5000"
  name: string;
  price: number; // cents
  category: 'keyboards' | 'ducks' | 'coffee' | 'stickers';
  stock: number; // 0 = out of stock
  rating: number; // 2.5 – 5.0
  imageUrl: string;
};

type ApiError = {
  error: {
    code: string; // machine-readable, e.g. "OUT_OF_STOCK"
    message: string; // for developers/logs, never shown raw in the UI
    details?: Record<string, string>; // field or product id → explanation
  };
};
```

## Endpoints

| Method | Endpoint                                                         | Success                                   | Errors                          |
| ------ | ---------------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| GET    | `/api/products?search=&category=&inStock=&sort=&page=&pageSize=` | `200 { items: Product[], total: number }` | 500                             |
| GET    | `/api/products/:id`                                              | `200 Product`                             | 404                             |
| POST   | `/api/login`                                                     | `200 { token, user }`                     | 400, 401                        |
| GET    | `/api/me`                                                        | `200 User`                                | 401                             |
| POST   | `/api/orders`                                                    | `201 { id, status: "queued" }`            | 400, 401, 409 when out of stock |
| GET    | `/api/orders/:id`                                                | `200 { id, status }`                      | 401, 404                        |

### GET /api/products

| Param      | Values                                                           | Default     | Notes                                         |
| ---------- | ---------------------------------------------------------------- | ----------- | --------------------------------------------- |
| `search`   | any text                                                         | —           | Case-insensitive match on `name`              |
| `category` | `keyboards` \| `ducks` \| `coffee` \| `stickers`                 | all         | Unknown values are ignored                    |
| `inStock`  | `true`                                                           | —           | **Extension:** only products with `stock > 0` |
| `sort`     | `relevance` \| `price-asc` \| `price-desc` \| `rating` \| `name` | `relevance` | **Extension:** the brief doesn't list values  |
| `page`     | integer ≥ 1                                                      | `1`         | Invalid values fall back to 1                 |
| `pageSize` | integer 1–5000                                                   | `24`        | **Extension**                                 |

`total` is the number of matches before paging, so the UI can show "1,154 products" and page numbers.

### GET /api/products/:id

`404 { error: { code: "NOT_FOUND" } }` when the id doesn't exist (try `/products/p-9999`).

### POST /api/login

Request body (**extension**, not in the brief): `{ "email": string, "password": string }`

- `400 VALIDATION_ERROR` with `details` per field, e.g. `{ "email": "Enter a valid email address" }`
- `401 INVALID_CREDENTIALS`
- `200 { token: string, user: User }`, where `User = { id, email, name }` (**extension**)

Demo account: **dev@bugbazaar.test / password123**

### GET /api/me

Header `Authorization: Bearer <token>`. `401 UNAUTHORIZED` if the token is missing, unknown or expired.

### POST /api/orders

Headers: `Authorization: Bearer <token>`, `Idempotency-Key: <uuid>` (**extension**, see D3-2).
Body (**extension**): `{ "items": [{ "productId": "p-0001", "quantity": 2 }] }`

- `400 VALIDATION_ERROR`: empty cart, bad quantity, unknown product
- `401 UNAUTHORIZED`
- `409 OUT_OF_STOCK`: `details` maps each product id to a message naming the product, e.g. `{ "p-0001": "Only 3 of Pirate Duckling (Mint) left" }`
- `201 { id, status: "queued" }`. Stock is decremented.
- **Idempotency:** if the `Idempotency-Key` was already used, the server returns the order it created the first time (same `id`) instead of creating another.

### GET /api/orders/:id

`200 { id, status }`. Status moves `queued` → `processing` (after 3 s) → `confirmed` (after 6 s) to simulate a background queue (**extension**: the brief only defines `queued`). `401` without a valid token, `404` if the order doesn't exist or belongs to someone else.

## Triggering every error on purpose

When mocks are on, a **Mock API controls** panel sits in the bottom-right corner.

| To see…                                                | Do this                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| 500 on the product list / details / login / order      | Tick the matching "→ 500" box                                               |
| 500 _after_ the order was saved (to test a safe retry) | Tick "order saved, then 500", place an order, untick, click Retry           |
| 409 out of stock                                       | Tick "409 out of stock" and place an order (or order more than is in stock) |
| 401                                                    | Click **Expire my session**, then open Account or place an order            |
| 404                                                    | Open `/products/p-9999` or `/orders/nope`                                   |
| 400                                                    | Log in with an email like `abc`                                             |
| Slow / out-of-order responses                          | Choose **Slow** or **Random** network speed                                 |

Settings live in `localStorage` (`bug-bazaar:mock-settings`), so they survive a reload. **Reset mock data** restores stock and clears sessions and orders.

## Seed data

`src/mocks/seed.ts` builds 5,000 products with a seeded random generator (mulberry32), so `p-0042` is the same product on every machine and every reload. About 10% are out of stock. Changes to stock, sessions and orders are saved in `localStorage` (`bug-bazaar:mock-db`) so the fake server "remembers" across reloads.

The contract is checked automatically in `src/mocks/handlers.test.ts`.
