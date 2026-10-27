<div align="center">

# 💳 Ledger — Accounts & Transactions Service

**A full-stack ledger with immutable transactions, atomic balance updates, and safe account-to-account transfers.**

![Node](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

[Overview](#-overview) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Implementation Plan](#-implementation-plan) · [API](#-api-reference) · [Run Locally](#-run-locally) · [Assumptions](#-assumptions)

</div>

---

## 📌 Overview

This service manages **accounts** and their **credit/debit transactions**. It guarantees:

| Guarantee | How it is enforced |
|---|---|
| **Immutability** | No update/delete routes + DB trigger blocks `UPDATE`/`DELETE` on `transactions` |
| **Balance consistency** | Balance changes only inside the same DB transaction that inserts the ledger row |
| **Atomicity** | Single `prisma.$transaction` per operation; any failure rolls back everything |
| **Concurrency safety** | Row-level lock (`SELECT … FOR UPDATE`) on the account(s) before balance checks |
| **Idempotency** | `UNIQUE (account_id, reference_id)` constraint, so duplicate references are rejected |
| **No negative balance** | Service-level check + `CHECK (balance >= 0)` constraint as a final safety net |

---

## 🧰 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 + TypeScript (strict) | Type safety, widely adopted |
| API | Express 4 | Minimal, explicit, easy to structure in layers |
| Database | PostgreSQL 16 | ACID transactions, row locks, CHECK/UNIQUE constraints |
| ORM | Prisma | Type-safe queries, migrations, interactive transactions |
| Validation | Zod | Single source of truth for request schemas and types |
| Docs | OpenAPI 3 + Swagger UI | Interactive API documentation at `/api/docs` |
| Logging | Pino | Structured, fast logging with request IDs |
| Testing | Jest + Supertest | Unit and integration tests |
| Frontend | React 18 + Vite + TypeScript + TanStack Query + Tailwind CSS | Fast DX, clean data fetching, clean UI |
| Tooling | ESLint, Prettier, Husky, lint-staged, Commitlint | Consistent code quality on every commit |
| Infra | Docker Compose | One-command local setup |

---

## 🏗 Architecture

### Request flow

```
Route ─► Validate (Zod) ─► Controller ─► Service ─► Repository ─► PostgreSQL
                                             │
                                  business rules + DB transaction
```

Responsibilities of each layer:

| Layer | Does | Does not |
|---|---|---|
| **Route** | Maps HTTP verb + path to a controller, attaches validators | Contain logic |
| **Controller** | Reads the validated request, calls the service, shapes the HTTP response | Talk to the DB |
| **Service** | Business rules, locking, atomic operations | Know about `req`/`res` |
| **Repository** | Data access only | Contain business rules |

### Folder structure

```
ledger/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                    # Zod-validated environment variables
│   │   ├── db/
│   │   │   └── prisma.ts                 # Prisma client singleton
│   │   ├── modules/
│   │   │   ├── account/
│   │   │   │   ├── account.routes.ts
│   │   │   │   ├── account.controller.ts
│   │   │   │   ├── account.service.ts
│   │   │   │   ├── account.repository.ts
│   │   │   │   ├── account.schema.ts
│   │   │   │   └── account.mapper.ts     # DB model → API response
│   │   │   ├── transaction/
│   │   │   │   └── … same layout
│   │   │   └── transfer/
│   │   │       └── … same layout
│   │   ├── shared/
│   │   │   ├── errors/
│   │   │   │   ├── app-error.ts
│   │   │   │   └── error-codes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── validate-request.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   ├── not-found-handler.ts
│   │   │   │   └── request-id.ts
│   │   │   └── utils/
│   │   │       ├── pagination.ts
│   │   │       ├── money.ts
│   │   │       └── async-handler.ts
│   │   ├── docs/
│   │   │   └── openapi.yaml
│   │   ├── app.ts                        # Express app (no listen)
│   │   └── server.ts                     # Bootstrap + graceful shutdown
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── helpers/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                          # Axios client + endpoint functions
│   │   ├── components/ui/                # Button, Input, Table, Badge, Modal, Toast
│   │   ├── features/
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   └── transfers/
│   │   ├── hooks/
│   │   ├── lib/                          # formatters, query client
│   │   ├── pages/
│   │   ├── types/
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── API.md
│   └── ASSUMPTIONS.md
├── docker-compose.yml
└── README.md
```

### Data model

```
┌──────────────────────────┐        ┌───────────────────────────────────┐
│ accounts                 │        │ transactions                      │
├──────────────────────────┤        ├───────────────────────────────────┤
│ id          UUID PK      │◄──┐    │ id            UUID PK             │
│ name        VARCHAR(100) │   └────│ account_id    UUID FK NOT NULL    │
│ balance     BIGINT ≥ 0   │        │ type          ENUM(credit,debit)  │
│ created_at  TIMESTAMPTZ  │        │ amount        BIGINT > 0          │
│ updated_at  TIMESTAMPTZ  │        │ description   VARCHAR(255) NULL   │
└──────────────────────────┘        │ reference_id  VARCHAR(64)         │
                                    │ transfer_id   UUID FK NULL        │
┌──────────────────────────┐        │ created_at    TIMESTAMPTZ         │
│ transfers (bonus)        │        ├───────────────────────────────────┤
├──────────────────────────┤        │ UNIQUE (account_id, reference_id) │
│ id               UUID PK │◄───────│ INDEX  (account_id, created_at)   │
│ from_account_id  UUID FK │        └───────────────────────────────────┘
│ to_account_id    UUID FK │
│ amount           BIGINT  │   CHECK (from_account_id <> to_account_id)
│ reference_id     UNIQUE  │
│ created_at  TIMESTAMPTZ  │
└──────────────────────────┘
```

> 💰 **Money handling:** amounts are stored as `BIGINT` in **minor units** (paise or cents) to avoid floating-point errors. The API accepts and returns decimal values with up to 2 places, and `shared/utils/money.ts` handles the conversion.

---

## 🗺 Implementation Plan

The work is split into **feature-wise phases**. Each phase is a separate branch and PR, and is only "done" when its acceptance criteria and tests pass.

```
Phase 0 ─► Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 7 ─► Phase 8 ─► Phase 9
 Setup     Core       Schema     Accounts   Create Tx  List Tx    Integrity  Transfer   Frontend   Docs &
           Foundation                                             Hardening  (Bonus)               Release
```

### Phase 0 — Project Setup & Tooling
`branch: chore/project-setup`

- [ ] Initialise the monorepo with `backend/` and `frontend/` directories
- [ ] Configure TypeScript in `strict` mode with path aliases (`@modules`, `@shared`)
- [ ] Set up ESLint and Prettier with shared rules
- [ ] Add Husky, lint-staged, and Commitlint using the Conventional Commits format
- [ ] Create `docker-compose.yml` for PostgreSQL (plus a test DB)
- [ ] Add `.env.example` and validate env vars at boot with Zod (`config/env.ts`)
- [ ] Add npm scripts: `dev`, `build`, `start`, `lint`, `format`, `test`, `db:migrate`, `db:seed`

**✅ Done when:** `npm run dev` boots an empty server, `npm run lint` passes, and the DB container is healthy.

---

### Phase 1 — Core Foundation
`branch: feat/core-foundation`

- [ ] Split `app.ts` and `server.ts` so tests can import the app without starting a listener
- [ ] Add a `request-id` middleware and Pino HTTP logger
- [ ] Add an `AppError` class plus a central `error-codes.ts` enum
- [ ] Add a global `error-handler` that maps Zod, Prisma, and AppError into one consistent format
- [ ] Add a `not-found-handler` for unknown routes
- [ ] Add a `validate-request` middleware (body, params, query) using Zod
- [ ] Add an `asyncHandler` wrapper so async controllers have no try/catch noise
- [ ] Add a `GET /api/v1/health` endpoint (app and DB connectivity)
- [ ] Set up Helmet, CORS, JSON body limit, and graceful shutdown

**Standard response envelope**

```json
// success
{ "success": true, "data": { }, "meta": { } }

// error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "amount", "message": "Amount must be greater than 0" }]
  }
}
```

**✅ Done when:** a malformed JSON body, an unknown route, and a thrown `AppError` all return the error envelope with the correct status.

---

### Phase 2 — Database Schema & Constraints
`branch: feat/database-schema`

- [ ] Write the Prisma schema for `accounts` and `transactions` (with `transfers` stubbed for Phase 7)
- [ ] Add a `transaction_type` enum: `credit`, `debit`
- [ ] Add a raw SQL migration for constraints Prisma can't express:
  - `CHECK (balance >= 0)` on accounts
  - `CHECK (amount > 0)` on transactions
  - Trigger `prevent_transaction_mutation` that raises on `UPDATE` / `DELETE`
- [ ] Add `UNIQUE (account_id, reference_id)` and `INDEX (account_id, created_at DESC, id DESC)`
- [ ] Add a seed script with 2–3 demo accounts and transactions

**✅ Done when:** migrations apply cleanly on a fresh DB, and a manual `UPDATE transactions …` in `psql` fails.

---

### Phase 3 — Accounts Feature
`branch: feat/accounts`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/accounts` | Create account (balance starts at 0) |
| `GET` | `/api/v1/accounts` | List accounts (paginated) |
| `GET` | `/api/v1/accounts/:accountId` | Get account with current balance |

- [ ] Write Zod schemas: `name` is required, trimmed, 1–100 characters; `accountId` must be a UUID
- [ ] Implement the repository, service, controller, and routes
- [ ] Add an `account.mapper.ts` to convert minor units to decimal and use snake_case output
- [ ] Return `404 ACCOUNT_NOT_FOUND` for a valid-but-unknown UUID
- [ ] Return `400 VALIDATION_ERROR` for a malformed UUID

**✅ Done when:** integration tests cover create, get, not-found, invalid ID, and missing name.

---

### Phase 4 — Create Transaction (Atomic)
`branch: feat/create-transaction`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/transactions` | Create a credit or debit for an account |

**Service flow (single DB transaction):**

```
BEGIN
  1. SELECT … FROM accounts WHERE id = $1 FOR UPDATE   → 404 if missing
  2. Check duplicate (account_id, reference_id)        → 409 if exists
  3. If debit and balance < amount                     → 422 INSUFFICIENT_BALANCE
  4. INSERT transaction
  5. UPDATE accounts SET balance = balance ± amount
COMMIT   (any error → ROLLBACK, nothing persisted)
```

- [ ] Validate the request: `account_id` (UUID), `type` (`credit|debit`), `amount` (> 0, max 2 decimals), `reference_id` (required), `description` (optional, ≤ 255)
- [ ] Implement `transactionService.createTransaction()` using `prisma.$transaction`
- [ ] Use a row lock to prevent race conditions between concurrent debits
- [ ] Map a Prisma `P2002` unique violation to `409 DUPLICATE_TRANSACTION`, as a fallback for race cases
- [ ] Make sure rejected transactions leave the balance untouched

**✅ Done when:**
- The assessment example (0 → +100 → +50 → −30 → −20) ends at **100**
- 10 parallel debits of 20 on a balance of 100 result in exactly 5 successes and a final balance of **0**
- A forced failure after the insert leaves no transaction row and an unchanged balance

---

### Phase 5 — List Transactions (Pagination & Sorting)
`branch: feat/list-transactions`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/accounts/:accountId/transactions?page=1&limit=10` | Paginated history, latest first |
| `GET` | `/api/v1/transactions/:transactionId` | Single transaction |

- [ ] Add a reusable `pagination.ts` helper with `parsePagination()` and `buildPaginationMeta()`
- [ ] Use defaults of `page=1, limit=10`; `limit` max is `100`
- [ ] Return `400 INVALID_PAGINATION` for values that are non-integer, `< 1`, or over the max
- [ ] Sort by `created_at DESC, id DESC`, using `id` as a stable tie-breaker
- [ ] Run `count` and `findMany` in parallel

**Response**

```json
{
  "success": true,
  "data": [ { "id": "…", "type": "debit", "amount": "20.00", "…": "…" } ],
  "meta": {
    "current_page": 1,
    "page_size": 10,
    "total_records": 4,
    "total_pages": 1
  }
}
```

**✅ Done when:** tests verify ordering, page boundaries, an empty last page, and invalid parameters.

---

### Phase 6 — Data Integrity Hardening
`branch: feat/integrity-hardening`

- [ ] Explicitly return `405 METHOD_NOT_ALLOWED` for `PUT/PATCH/DELETE` on transactions
- [ ] Add a balance reconciliation test: `balance == SUM(credits) − SUM(debits)` for every account
- [ ] Add a test proving the DB trigger blocks direct mutation
- [ ] Review that every write path goes through a DB transaction

**✅ Done when:** all integrity tests pass and the reconciliation check holds after the full test suite.

---

### Phase 7 — Money Transfer (Bonus)
`branch: feat/transfers`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/transfers` | Move money from one account to another |

**Service flow (single DB transaction):**

```
BEGIN
  1. Reject if from_account_id == to_account_id         → 400 SAME_ACCOUNT_TRANSFER
  2. Lock BOTH accounts FOR UPDATE, ordered by id       → prevents deadlocks
  3. 404 if either account is missing
  4. 422 if source balance < amount
  5. INSERT transfer row
  6. INSERT debit tx (source) + credit tx (destination), linked via transfer_id
  7. UPDATE both balances
COMMIT   (any error → ROLLBACK, no partial transfer possible)
```

- [ ] Write a Zod schema with `from_account_id`, `to_account_id`, `amount`, `reference_id`, and optional `description`
- [ ] Lock accounts in a deterministic order to avoid deadlocks
- [ ] Have the transfer response include both resulting transactions and the new balances

**✅ Done when:**
- The assessment example (A: 100, B: 50, transfer 30) ends with **A = 70, B = 80**
- A simulated failure between debit and credit leaves both balances unchanged
- Concurrent opposite-direction transfers (A→B and B→A) complete without deadlock

---

### Phase 8 — Frontend
`branch: feat/frontend`

| Screen | Features |
|---|---|
| **Accounts dashboard** | Account cards with balance, a "Create account" modal |
| **Account detail** | Balance header, paginated transaction table with credit/debit badges |
| **New transaction** | Form with type toggle, amount, reference ID, and inline validation |
| **Transfer** | From/to account selectors, amount, and a confirmation step |

- [ ] Set up an Axios client with an interceptor that maps the API error envelope into toast messages
- [ ] Use TanStack Query for fetching and caching, and invalidate the balance after mutations
- [ ] Build reusable UI primitives in `components/ui/`
- [ ] Add loading skeletons, empty states, and error states
- [ ] Format currency through a single `formatMoney()` helper
- [ ] Make the layout responsive (mobile-first with Tailwind)

**✅ Done when:** every API feature is usable from the UI, and API errors appear as clear messages.

---

### Phase 9 — Documentation & Release
`branch: docs/final-submission`

- [ ] Write the OpenAPI spec for every endpoint, with examples and error responses
- [ ] Serve Swagger UI at `/api/docs`
- [ ] Write `docs/API.md` as a quick reference with curl examples
- [ ] Write `docs/ASSUMPTIONS.md`
- [ ] Add a Postman collection (optional)
- [ ] Check this README end to end on a fresh clone
- [ ] Do a final pass: no lint warnings, no `console.log`, no dead code, and all tests green

---

## 📡 API Reference

Base URL: `http://localhost:4000/api/v1`. Full interactive docs are at `http://localhost:4000/api/docs`.

| Method | Endpoint | Success | Notes |
|---|---|---|---|
| `GET` | `/health` | `200` | App + DB status |
| `POST` | `/accounts` | `201` | Create account |
| `GET` | `/accounts` | `200` | Paginated list |
| `GET` | `/accounts/:accountId` | `200` | Account + balance |
| `POST` | `/transactions` | `201` | Credit or debit |
| `GET` | `/transactions/:transactionId` | `200` | Single transaction |
| `GET` | `/accounts/:accountId/transactions` | `200` | Paginated, latest first |
| `POST` | `/transfers` | `201` | Bonus: atomic transfer |

### Example: create a transaction

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "6f1c…",
    "type": "debit",
    "amount": 30,
    "reference_id": "INV-1001",
    "description": "Office supplies"
  }'
```

### Error codes

| HTTP | Code | When |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid or missing body fields, invalid type, amount ≤ 0 |
| `400` | `INVALID_REQUEST_BODY` | Malformed JSON |
| `400` | `INVALID_PAGINATION` | Bad `page` / `limit` |
| `400` | `SAME_ACCOUNT_TRANSFER` | Source equals destination |
| `404` | `ACCOUNT_NOT_FOUND` | Unknown account ID |
| `404` | `TRANSACTION_NOT_FOUND` | Unknown transaction ID |
| `404` | `ROUTE_NOT_FOUND` | Unknown endpoint |
| `405` | `METHOD_NOT_ALLOWED` | Attempt to edit or delete a transaction |
| `409` | `DUPLICATE_TRANSACTION` | `reference_id` already used for this account |
| `422` | `INSUFFICIENT_BALANCE` | Debit or transfer exceeds balance |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected failure (details logged, not exposed) |

---

## 🚀 Run Locally

### Prerequisites
- Node.js 20+
- Docker and Docker Compose

### Option A: Docker (recommended)

```bash
git clone <repo-url> ledger && cd ledger
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |

### Option B: Manual

```bash
# database
docker compose up -d postgres

# backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment variables

| Variable | Example | Description |
|---|---|---|
| `PORT` | `4000` | API port |
| `DATABASE_URL` | `postgresql://ledger:ledger@localhost:5432/ledger` | Main DB |
| `TEST_DATABASE_URL` | `postgresql://ledger:ledger@localhost:5433/ledger_test` | Test DB |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | Frontend → API |

### Tests

```bash
cd backend
npm test                 # all tests
npm run test:unit
npm run test:integration
npm run test:coverage
```

---

## 🧹 Code Standards

| Area | Standard |
|---|---|
| **Naming** | Files use `kebab-case`; variables and functions use `camelCase`; types and classes use `PascalCase`; constants use `UPPER_SNAKE_CASE` |
| **Functions** | Single responsibility, verb-first names (`createTransaction`, `findAccountById`, `assertSufficientBalance`), roughly 30 lines or fewer |
| **Comments** | Only explain *why*, never *what*; no commented-out code |
| **Types** | No `any`; request types are inferred from Zod schemas (`z.infer`) |
| **Errors** | Always throw `AppError` with a code from `error-codes.ts`; never send raw errors to the client |
| **API fields** | `snake_case` in JSON, `camelCase` in code, with conversion handled in mappers |
| **Magic values** | Kept in constants (`MAX_PAGE_LIMIT`, `DEFAULT_PAGE_SIZE`) |
| **Commits** | Conventional Commits, e.g. `feat(transactions): add atomic debit flow` |
| **Branches** | `feat/*`, `fix/*`, `chore/*`, `docs/*`, with one feature per PR |

---

## 📝 Assumptions

1. **Missing brief sections.** Sections 1–4 and 6 of the brief were not available; they are assumed to describe setup, the Accounts API, and the Transactions API (create and list).
2. **Currency.** There is a single currency per system. Amounts allow up to 2 decimal places and are stored in minor units.
3. **Initial balance.** New accounts always start at `0`; funds are added only via credit transactions.
4. **Duplicate `reference_id`.** A duplicate reference for the same account is rejected with `409`. The same `reference_id` is allowed on different accounts.
5. **Transfers.** Each transfer creates two immutable ledger entries (one debit and one credit) linked by `transfer_id`. Transfer `reference_id` values are globally unique.
6. **Accounts.** Accounts cannot be deleted, which protects ledger history.
7. **Authentication.** Authentication and authorisation are out of scope.
8. **Timestamps.** All timestamps are stored and returned in UTC (ISO 8601).

---

## 🔭 Future Improvements

- Authentication (JWT) and per-user account ownership
- An `Idempotency-Key` header for safe client retries
- Cursor-based pagination for very large histories
- Multi-currency support with exchange rates
- Rate limiting and an audit log
- A CI pipeline (GitHub Actions) running lint, tests, and build on every PR

---

<div align="center">

Built with care as part of the **Full Stack Developer Assessment**.

</div>