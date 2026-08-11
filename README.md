# SCIC13 Backend REST API

A simple e-commerce REST API built with **Express**, **Prisma** (PostgreSQL), and **JWT auth**.

## Features

- User registration & login with JWT (access + refresh tokens, refresh rotation)
- Roles: `USER` and `ADMIN`
- Categories, Products, Cart Items, Orders (with order items)
- Soft-delete pattern (`isDeleted`) on users, categories, products, orders

## Tech Stack

- Node.js + Express 5 (TypeScript, run with `tsx`)
- Prisma 7 + PostgreSQL
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcrypt`)

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Database** — create a PostgreSQL database and set the URL in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:rasel@localhost:5432/SCIC13_Backend_Rest_API?schema=public"
   PORT=3000
   JWT_SECRET="your-random-secret"
   JWT_REFRESH_SECRET="another-random-secret"
   JWT_EXPIRES_IN=15m
   ```

3. **Sync the schema**
   ```bash
   pnpm prisma db push
   ```

4. **Run the dev server**
   ```bash
   pnpm dev
   ```

5. Open http://localhost:3000

## Project Structure

```
src/
  app.ts               # Express app + static files
  server.ts            # Server entry + error handler
  routes/index.ts      # Mounts all routers under /api
  services/            # Route handlers (auth, users, products, ...)
  middleware/auth.ts   # authenticate + authorize(role) middlewares
  lib/                 # prisma client, jwt, password hashing
  generated/prisma     # Generated Prisma client
prisma/schema.prisma   # Data models
public/                # Frontend pages (storefront + API console)
```

## API Documentation

Full endpoint reference: **[API.md](./API.md)**

Quick test pages (served by the app):

- **Storefront:** http://localhost:3000/ — browse products, add to cart, place orders
- **API console:** http://localhost:3000/console.html — raw request testing UI

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Run dev server with hot reload |
| `pnpm prisma db push` | Sync the database with the schema |
| `pnpm prisma migrate dev` | Create/apply migrations |
| `pnpm prisma generate` | Regenerate the Prisma client |
| `pnpm prisma studio` | Open Prisma Studio (DB browser) |

## Notes

- Registration is public; user **update/delete** require the `ADMIN` role.
- Order stock is decremented on order creation and restored on cancel/delete. Known quirks are listed in [API.md](./API.md) → *Notes*.
