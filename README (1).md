# E-ShopX — Microservices-Based E-Commerce Platform

E-ShopX is a full-stack e-commerce system built around a **microservices architecture**, designed to demonstrate real-world patterns used in production systems: service isolation, database-per-service, API gateway routing, and a **saga-based compensating transaction pattern** for maintaining data consistency across independently-owned databases.

Unlike a typical monolithic e-commerce clone, every core capability — authentication, catalog, inventory, cart, orders, payments, and notifications — is its own independently deployable service with its own database, communicating over REST APIs.

---

## Table of Contents

- [Why Microservices](#why-microservices)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Services Breakdown](#services-breakdown)
- [The Saga Pattern — Order Consistency](#the-saga-pattern--order-consistency)
- [Payment Integration](#payment-integration)
- [Database Design](#database-design)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Testing the System](#testing-the-system)
- [Known Limitations & Future Work](#known-limitations--future-work)
- [Author](#author)

---

## Why Microservices

Most student e-commerce projects are built as a single Express app with one shared database. E-ShopX deliberately avoids that in order to demonstrate:

1. **Service isolation** — each service can be developed, deployed, scaled, and even rewritten independently without touching the others.
2. **Database-per-service** — no service directly queries another service's database. All cross-service data access happens through HTTP APIs, which mirrors how real production systems avoid tight coupling.
3. **Fault isolation** — if the Notification Service goes down, checkout still works; if Inventory Service goes down, browsing the catalog still works.
4. **Independent scaling** — in a real deployment, Catalog Service (read-heavy) could be scaled to many instances while Payment Service (write-heavy, security-critical) stays limited and tightly monitored.
5. **The hard part, done properly** — distributed transactions. When an order touches Cart, Inventory, and Payment (three separate databases), there is no native database transaction that can span all three. E-ShopX solves this with the **saga pattern**, described in detail below.

---

## Architecture Overview

```
                              +-------------------+
                              |   React Frontend   |
                              |  (Vite + Tailwind) |
                              +----------+---------+
                                         |
                                         v
                              +-------------------+
                              |    API Gateway     |  :4000
                              | (single entry point)|
                              +----------+---------+
                                         |
        +-------------+-----------------+-----------------+--------------+--------------+
        v             v                 v                 v              v              v
  +----------+  +-----------+   +-------------+   +-----------+  +-----------+  +--------------+
  |   Auth   |  |  Catalog  |   |  Inventory  |   |   Cart    |  |   Order   |  |   Payment    |
  | Service  |  |  Service  |   |  Service    |   |  Service  |  |  Service  |  |   Service    |
  |  :4001   |  |   :4002   |   |   :4003     |   |  :4004    |  |  :4005    |  |   :4006      |
  +----+-----+  +-----+-----+   +------+------+   +-----+-----+  +-----+-----+  +------+-------+
       |              |                |                |              |               |
       v              v                v                v              v               v
  +--------+    +----------+    +------------+    +--------+    +----------+    +-------------+
  |auth_db |    |catalog_db|    |inventory_db|    |cart_db |    | order_db |    | payment_db  |
  +--------+    +----------+    +------------+    +--------+    +----------+    +-------------+
                                                                                        |
                                                                                        v
                                                                               +------------------+
                                                                               |  Razorpay API     |
                                                                               |  (test mode)      |
                                                                               +------------------+

                              +-------------------+
                              | Notification       |  :4007
                              | Service (SMTP)      |
                              +----------+---------+
                                         v
                              +-------------------+
                              | notification_db     |
                              +-------------------+
```

Every service is **stateless** and containerized. Every database is **isolated** — no service has credentials to another service's database. All inter-service communication happens over HTTP, using plain REST (no message queue in the current version — see [Future Work](#known-limitations--future-work)).

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 20 + Express | Fast to iterate, huge ecosystem, consistent across all services |
| Database | PostgreSQL 16 (one instance per service) | ACID guarantees needed for orders/inventory/payments |
| ORM | Prisma | Type-safe queries, painless migrations, auto-generated client |
| Containerization | Docker + Docker Compose | Every database runs in its own container; whole backend spins up with one command |
| API Gateway | Express + `http-proxy-middleware` | Single entry point, JWT verification, request routing |
| Auth | JWT (JSON Web Tokens) | Stateless auth tokens verified independently by the Gateway |
| Payments | Razorpay (test mode) | Real payment gateway integration — order creation, checkout widget, HMAC-SHA256 signature verification |
| Notifications | Nodemailer (SMTP via Gmail App Password) | Order confirmation / failure emails |
| Frontend | React + Vite + Tailwind CSS | Fast dev server, utility-first styling |
| DB Management | DBeaver | Visual inspection of all 7 databases, schema browsing, manual queries |
| API Testing | Postman | Organized collections per service, environment variables for tokens/URLs |
| Workflow Automation (planned) | n8n | Event-driven notification workflows decoupled from service code |

---

## Services Breakdown

### 1. API Gateway (`:4000`)
Single entry point for all client requests. Routes `/api/<service>/*` to the correct backend service. Verifies JWTs on protected routes before forwarding requests, so downstream services don't each need their own auth logic.

### 2. Auth Service (`:4001`)
Handles signup, login, and JWT issuance. Owns `auth_db` (users, credentials).

### 3. Catalog Service (`:4002`)
Product and category browsing. Supports search and category filtering. Owns `catalog_db`.

- `Product` and `Category` models, related via foreign key
- Products can be deactivated (soft delete) rather than hard-deleted, preserving order history integrity

### 4. Inventory Service (`:4003`) — the consistency showcase
Owns `inventory_db`. Implements the **reserve -> confirm/release** saga pattern (full explanation below). This is the service that proves the system can maintain consistency across a distributed transaction without a shared database.

- `Stock` table: tracks `totalStock` and `reservedStock` per product
- `Reservation` table: an audit trail of every reservation, its status (`PENDING` / `CONFIRMED` / `RELEASED`), tied to an `orderId`

### 5. Cart Service (`:4004`)
Per-user shopping cart. Owns `cart_db`.

- Fetches live product prices from Catalog Service and **snapshots** them into the cart item, so a price change elsewhere doesn't silently alter what's already in someone's cart
- Cart is automatically cleared by Order Service after a successful checkout

### 6. Order Service (`:4005`) — the orchestrator
Owns `order_db`. This is the "brain" of the system — it doesn't own inventory or payment logic itself, but coordinates calls across Cart, Inventory, and Payment services to execute a full checkout as a saga.

### 7. Payment Service (`:4006`)
Owns `payment_db`. Wraps the Razorpay API:

- Creates a Razorpay order matching the internal order amount
- Exposes the `keyId` needed by the frontend's Razorpay checkout widget
- **Verifies payment signatures server-side** using HMAC-SHA256 — never trusts the client's claim that a payment succeeded
- Includes a standalone test checkout page (`public/checkout-test.html`) that triggers the real Razorpay payment widget for demo purposes

### 8. Notification Service (`:4007`)
Owns `notification_db`. Sends order confirmation/failure emails via SMTP (Gmail App Password), logs every send attempt (success or failure) to its own database for auditability.

---

## The Saga Pattern — Order Consistency

This is the core architectural concept the whole project is built to demonstrate.

### The problem

A single checkout touches **three separate databases**: Cart, Inventory, and Payment. In a monolith, you'd wrap this in one database transaction and roll back on any failure. In a microservices architecture, that's not possible — there is no single transaction that can span three independent PostgreSQL instances.

### The solution — compensating transactions

Instead of one atomic transaction, Order Service executes a sequence of steps, and if a later step fails, it explicitly **undoes** the effects of earlier steps:

```
1. Fetch cart from Cart Service
2. Create Order record (status: PENDING)
3. Reserve stock in Inventory Service
     - this locks the stock (reservedStock += quantity) WITHOUT deducting totalStock
     - if reservation fails (insufficient stock), the order fails immediately,
       nothing further happens, no compensation needed
4. Create a Razorpay payment order via Payment Service
     - Order status becomes AWAITING_PAYMENT
5. Frontend opens the Razorpay checkout widget, user completes (or fails) payment
6a. PAYMENT SUCCEEDS:
     -> Payment Service verifies the signature (HMAC-SHA256)
     -> Order Service calls Inventory Service's /confirm endpoint
         - this is where stock is ACTUALLY deducted (totalStock -= quantity)
         - reservedStock is decremented back to 0 for these items
     -> Order Service clears the user's cart
     -> Order status becomes CONFIRMED
6b. PAYMENT FAILS (or signature verification fails):
     -> Order Service calls Inventory Service's /release endpoint
         - this is the COMPENSATING TRANSACTION
         - reservedStock is decremented, freeing the stock back up for other customers
         - totalStock is untouched, because it was never actually deducted
     -> Order status becomes FAILED
     -> Cart is left untouched, so the user can retry checkout
```

### Why reserve/confirm/release instead of reserve/deduct directly

If stock were deducted immediately at reservation time, a failed payment would require "giving back" stock that's already been sold in the database — which is more error-prone and makes the system's state harder to reason about mid-transaction. By keeping `totalStock` and `reservedStock` as two separate counters, the "true" available stock is always `totalStock - reservedStock`, and nothing is ever permanently changed until payment is actually confirmed.

### Proof this works (tested manually during development)

1. Reserved 5 units -> `available` dropped from 50 to 45 (stock **locked**, not deducted)
2. Confirmed the order -> `totalStock` dropped to 45 permanently (stock **deducted**)
3. Reserved 10 more units on a new order -> `available` dropped to 35
4. Simulated a payment failure -> called `/release` -> `available` went back to 45 (stock **restored**, compensating transaction proven)

---

## Payment Integration

Real Razorpay integration in **test mode** (no live transactions, no real money, no business KYC required for test API keys).

**Flow:**
1. `POST /payment/create-order` — Payment Service creates a matching order on Razorpay's side, returns the `razorpayOrderId` and public `keyId`
2. Frontend (or the included `checkout-test.html` demo page) opens Razorpay's hosted checkout widget using those values
3. User completes payment using Razorpay's test card numbers (e.g. `4111 1111 1111 1111`) or test UPI ID (`success@razorpay`)
4. Razorpay's widget returns `razorpay_payment_id` and `razorpay_signature` to the frontend
5. Frontend sends these to `POST /orders/:orderId/complete`
6. Order Service forwards them to Payment Service's `/payment/verify` endpoint
7. Payment Service **recomputes the expected signature server-side** using HMAC-SHA256 with the Razorpay key secret, and compares it — this is the actual security boundary; a client can't forge a "successful payment" without knowing the secret key

---

## Database Design

Every service owns exactly one PostgreSQL database. No service has credentials to another service's database — all cross-service reads happen over HTTP.

| Database | Port | Owned By | Key Tables |
|---|---|---|---|
| `auth_db` | 5433 | Auth Service | User |
| `catalog_db` | 5435 | Catalog Service | Product, Category |
| `inventory_db` | 5436 | Inventory Service | Stock, Reservation |
| `cart_db` | 5437 | Cart Service | Cart, CartItem |
| `order_db` | 5438 | Order Service | Order, OrderItem |
| `payment_db` | 5439 | Payment Service | Payment |
| `notification_db` | 5440 | Notification Service | NotificationLog |

Product references between services (e.g. `CartItem.productId`, `OrderItem.productId`) are **not** foreign keys, since they point across database boundaries — they're validated at write-time via an HTTP call to Catalog Service instead.

---

## API Reference

All routes below can be called directly against each service, or through the API Gateway at `http://localhost:4000/api/<service-name>/...`.

### Auth Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/me` | Protected route, verifies JWT via Gateway |

### Catalog Service
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products (supports `?category=` and `?search=`) |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create product |
| GET | `/categories` | List categories |

### Inventory Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/stock` | Initialize/update stock for a product |
| GET | `/stock/:productId` | Check current stock and availability |
| POST | `/reserve` | Reserve stock for an order (saga step) |
| POST | `/confirm` | Confirm reservation, permanently deduct stock |
| POST | `/release` | Release reservation, restore stock (compensating transaction) |

### Cart Service
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart/:userId` | Get (or create) a user's cart |
| POST | `/cart/:userId/items` | Add item to cart |
| PUT | `/cart/:userId/items/:productId` | Update item quantity |
| DELETE | `/cart/:userId/items/:productId` | Remove one item |
| DELETE | `/cart/:userId` | Clear entire cart |

### Order Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/checkout` | Start checkout: reserve stock, create payment intent |
| POST | `/orders/:orderId/complete` | Complete order after payment (verify, confirm/release) |
| GET | `/orders/:orderId` | Get order details |
| GET | `/orders/user/:userId` | Get all orders for a user |

### Payment Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payment/create-order` | Create a Razorpay order |
| POST | `/payment/verify` | Verify payment signature |
| GET | `/payment/:orderId` | Get payment status by order ID |

### Notification Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/notifications/order-confirmed` | Send order confirmation email |
| POST | `/notifications/order-failed` | Send order failure email |
| GET | `/notifications/logs` | View recent notification send attempts |

---

## Project Structure

```
online-shopping-system/
├── docker-compose.yml          # All 7 Postgres containers
├── auth-service/
├── api-gateway/
├── catalog-service/
├── inventory-service/
├── cart-service/
├── order-service/
├── payment-service/
│   └── public/checkout-test.html   # Standalone Razorpay demo page
├── notification-service/
└── frontend/                   # React + Vite + Tailwind
```

Each backend service follows the same internal layout:

```
<service-name>/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/            # (where present) service-to-service HTTP clients
│   └── server.js
├── .env
├── package.json
└── Dockerfile
```

---

## Setup & Installation

### Prerequisites
- Node.js 20+
- Docker Desktop
- A Razorpay account (test mode API keys — no business verification needed)
- A Gmail account with an App Password generated (for Notification Service)

### 1. Start all databases
```bash
cd online-shopping-system
docker-compose up -d
docker ps   # confirm all 7 containers show "Up"
```

### 2. Set up each service
Repeat for each of: `auth-service`, `api-gateway`, `catalog-service`, `inventory-service`, `cart-service`, `order-service`, `payment-service`, `notification-service`

```bash
cd <service-name>
cp .env.example .env
# edit .env with real values where needed (Razorpay keys, SMTP credentials, etc.)
npm install
npx prisma migrate dev --name init
npm run dev
```

**Important**: start services roughly in this order, since some depend on others being reachable during seeding:
1. Auth Service
2. API Gateway
3. Catalog Service -> run `npm run seed` after migrating
4. Inventory Service -> run `npm run seed` after migrating (pulls product IDs from Catalog Service, so Catalog must already be running)
5. Cart Service
6. Order Service
7. Payment Service
8. Notification Service

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Testing the System

### Via Postman
Import a collection with one folder per service, using an environment variable `gateway_url = http://localhost:4000` and `token` (set automatically after login).

### Via DBeaver
Add one PostgreSQL connection per service database (ports 5433-5440), username `admin`, password `admin123`. Useful for visually confirming the saga pattern's effect on `Stock` and `Reservation` tables during a live demo.

### Manual end-to-end saga test (PowerShell)
```powershell
# 1. Add item to cart
$body = @{ productId = "<real-product-id>"; quantity = 2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4004/cart/demo-user/items" -Method POST -Body $body -ContentType "application/json"

# 2. Checkout (reserves stock, creates payment order)
$body = @{ userId = "demo-user" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4005/orders/checkout" -Method POST -Body $body -ContentType "application/json"

# 3. Complete payment via the browser widget at:
#    http://localhost:4006/checkout-test.html

# 4. Check stock before/after to confirm deduction or restoration
Invoke-RestMethod -Uri "http://localhost:4003/stock/<product-id>" -Method GET
```

---

## Known Limitations & Future Work

This project intentionally scopes out some things that a production system would need, in order to focus depth on the consistency/saga pattern:

- **No message queue** — inter-service calls are direct synchronous HTTP requests. A production system would likely use RabbitMQ or Kafka for the notification/webhook side, so a slow or down Notification Service can't block order confirmation. n8n is planned to be layered in here for event-driven workflow orchestration.
- **No idempotency keys** — retried requests (e.g. a flaky network causing a duplicate `/confirm` call) aren't currently deduplicated. Production systems would add idempotency keys to prevent double-processing.
- **No distributed tracing** — logs are per-service; correlating a single checkout across 4 services' logs is currently manual. A tool like Jaeger or OpenTelemetry would solve this at scale.
- **Duplicate seed data risk** — running a seed script twice can create duplicate catalog entries, since `Product.createMany` doesn't currently check for existing rows by name. Minor, not blocking, worth cleaning up with a proper `upsert`.
- **JWT refresh tokens** — current auth uses short-lived JWTs without a refresh flow.

---

## Author

Built by **Atharva Jadhav**, Second Year Computer Engineering student (Mumbai University, NEP 2020), as a portfolio project demonstrating microservices architecture, distributed transaction handling, and real payment gateway integration for software engineering internship applications.
