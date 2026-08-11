# SCIC13 REST API — Simple Documentation

> Beginner-friendly reference for the SCIC13 backend API.

## Basics

- **Base URL:** `http://localhost:3000/api`
- **Data format:** JSON. Send `Content-Type: application/json` for POST/PATCH/PUT.
- **Response format** (success):
  ```json
  { "success": true, "message": "Something done", "data": { ... } }
  ```
- **Response format** (error):
  ```json
  { "success": false, "message": "What went wrong" }
  ```

### Authentication (JWT)

1. `POST /api/auth/register` or `POST /api/auth/login` → you get an `accessToken` and a `refreshToken`.
2. Send the access token on protected requests:

   ```
   Authorization: Bearer <accessToken>
   ```

3. Access tokens expire after 15 minutes. Use `POST /api/auth/refresh` to get a new pair.
4. Only `PATCH` and `DELETE /api/users/:id` need the **ADMIN** role. Everything else is public.

---

## Auth

### POST /api/auth/register
Create a new user (role is always `USER`).

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secret123"}'
```

Rules: email must look like an email, password ≥ 8 characters.

| Result | Code | Response |
|---|---|---|
| Success | 201 | user object (no password) |
| Missing fields | 400 | message |
| Email already used | 409 | `"Email already exists"` |

### POST /api/auth/login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'
```

| Result | Code | Response |
|---|---|---|
| Success | 200 | `{ accessToken, refreshToken, user }` |
| Wrong email/password | 401 | `"Invalid email or password"` |

### POST /api/auth/refresh
Get a new token pair using your refresh token (the old one is revoked).

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
```

Returns `{ accessToken, refreshToken }` or `401` if the token was revoked/expired.

### POST /api/auth/logout
Revoke the refresh token (server-side sign out).

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
```

### GET /api/auth/me
Returns the logged-in user. **Requires** `Authorization: Bearer <accessToken>`.

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## Users

### POST /api/users  *(old-style register)*
Same as `/api/auth/register` but returns HTTP `200`.

### GET /api/users
List all non-deleted users.

```bash
curl http://localhost:3000/api/users
```

### GET /api/users/:id

```bash
curl http://localhost:3000/api/users/abc-123
```

| Result | Code |
|---|---|
| Found | 200 |
| Not found / deleted | 404 |

### PATCH /api/users/:id  *(ADMIN only)*
Update name, email, password, or role. Send `Authorization: Bearer <adminToken>`.

```bash
curl -X PATCH http://localhost:3000/api/users/abc-123 \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Johnny","role":"ADMIN"}'
```

| Result | Code |
|---|---|
| Success | 200 |
| No token | 401 |
| Not ADMIN | 403 |
| Not found | 404 |

### DELETE /api/users/:id  *(ADMIN only)*
Soft-deletes the user (`isDeleted = true`, row stays in DB).

---

## Categories

### POST /api/categories

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics"}'
```

| Result | Code |
|---|---|
| Created | 201 |
| Name empty / already exists | 400 |

### GET /api/categories
List categories (not deleted), each with its `products`.

### PATCH /api/categories/:id

```bash
curl -X PATCH http://localhost:3000/api/categories/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Gadgets"}'
```

### DELETE /api/categories/:id
Soft-delete by default. Use `?permanent=true` to hard-delete:

```bash
curl -X DELETE "http://localhost:3000/api/categories/abc-123?permanent=true"
```

---

## Products

### POST /api/products

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Wireless Mouse","price":1500,"stock":15,"categoryId":"cat-123"}'
```

Required: `name`, `price` (> 0), `stock` (≥ 0), `categoryId`. Optional: `description`.

| Result | Code |
|---|---|
| Success | 200 |
| Missing fields / price ≤ 0 | 400 |
| Category doesn't exist | 404 |

### GET /api/products
List non-deleted products (with their category).

### GET /api/products/:id

### PUT /api/products/:id
Full update (send all fields you want to change).

```bash
curl -X PUT http://localhost:3000/api/products/prod-123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Wireless Mouse 2","price":1800,"stock":10,"categoryId":"cat-123"}'
```

### DELETE /api/products/:id
Soft-deletes the product.

---

## Cart Items

A cart item belongs to a user + product (one row per user+product; adding again increases the quantity).

### POST /api/cart-items

```bash
curl -X POST http://localhost:3000/api/cart-items \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","productId":"prod-123","quantity":2}'
```

| Result | Code |
|---|---|
| Added / quantity increased | 201 |
| Missing fields / quantity ≤ 0 | 400 |
| Product not found | 404 |
| Not enough stock | 400 |

### GET /api/cart-items
All cart items. Filter by user:

```bash
curl "http://localhost:3000/api/cart-items?userId=user-123"
```

With `userId` it also returns `totalCartValue`.

### PATCH /api/cart-items/:id
Set a new quantity.

```bash
curl -X PATCH http://localhost:3000/api/cart-items/item-123 \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}'
```

### DELETE /api/cart-items/:id

---

## Orders

### POST /api/orders

**Option A — order from the user's cart** (clears the cart):

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","cartItems":[]}'
```

**Option B — order specific items** (cart is NOT cleared):

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","cartItems":[{"productId":"prod-123","quantity":2,"price":1500}]}'
```

| Result | Code |
|---|---|
| Success | 200 |
| Missing `userId`/`cartItems` | 400 |
| Product not found | 404 |
| Not enough stock | 400 |
| Cart empty (option A) | 400 |

### GET /api/orders
All non-deleted orders. Filter by user:

```bash
curl "http://localhost:3000/api/orders?userId=user-123"
```

### GET /api/orders/:id

### GET /api/orders/:id/items
Order items with their product info.

### PATCH /api/orders/:id
Update status / shipping address / total.

```bash
curl -X PATCH http://localhost:3000/api/orders/ord-123 \
  -H "Content-Type: application/json" \
  -d '{"status":"SHIPPED"}'
```

Valid statuses: `PENDING`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.

### DELETE /api/orders/:id
Soft-deletes the order.

---

## Status code cheat sheet

| Code | Meaning |
|---|---|
| 200 / 201 | Success (created) |
| 400 | Bad request / validation failed |
| 401 | Not authenticated / wrong token |
| 403 | Authenticated but not allowed (not ADMIN) |
| 404 | Resource not found |
| 500 | Server error (something crashed) |

---

## Notes / known quirks (read before testing)

- **Order price is taken from the request body** — the server does NOT check it against the real product price (send the product's real price, or totals will be wrong).
- **Product stock IS decremented when an order is created**, and restored back if the order is `CANCELLED` or deleted. Over-stock orders are rejected.
- **Cart POST/PATCH responses only include safe user fields** (`id`, `name`, `email`) — no password.

