<div align="center">

# Ledger: Accounts & Transactions Service

**A full-stack ledger with immutable transactions, atomic balance updates and safe
account-to-account transfers.**

![Node](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

[Overview](#overview) · [Screenshots](#screenshots) · [Run locally](#run-locally) · [API](#api) · [Architecture](#architecture) ·
[Testing](#testing) · [Assumptions](docs/ASSUMPTIONS.md)

</div>

---

## Overview

The service manages **accounts** and their **credit/debit transactions**, plus atomic
**transfers** between accounts, with a React frontend on top.

| Guarantee               | How it is enforced                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Immutability**        | No update/delete routes (`405`), plus a DB trigger that rejects `UPDATE`/`DELETE` on ledger tables |
| **Balance consistency** | The balance changes only inside the same DB transaction that inserts the ledger row                |
| **Atomicity**           | One `prisma.$transaction` per operation; any failure rolls everything back                         |
| **Concurrency safety**  | Row lock (`SELECT … FOR UPDATE`) before balance checks; transfers lock both accounts in id order   |
| **Idempotency**         | `UNIQUE (account_id, reference_id)`; duplicate references return `409`                             |
| **No negative balance** | Service-level check under the lock, plus `CHECK (balance >= 0)` as the final safety net            |
| **Exact money**         | Stored as `BIGINT` minor units; string-based conversion, no floating-point maths                   |

These guarantees are proven by tests, not just claimed. Highlights:

- 10 parallel debits of 20 on a balance of 100 → exactly 5 succeed, final balance 0.
- 20 concurrent A→B / B→A transfers → no deadlock.
- A forced crash between debit and credit → nothing persisted.
- After every API-driven test, every account satisfies `balance == SUM(credits) − SUM(debits)`.

## Screenshots

| Accounts                                        | Account detail                                         | Transfer                                        |
| ----------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| ![Accounts list](docs/screenshots/accounts.png) | ![Account detail](docs/screenshots/account-detail.png) | ![Transfer form](docs/screenshots/transfer.png) |

## Tech stack

| Layer    | Choice                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| Runtime  | Node.js 20 + TypeScript (strict)                                               |
| API      | Express 4, Zod validation, Pino logging, Helmet, CORS                          |
| Database | PostgreSQL 16 via Prisma 6 (plus raw SQL for CHECKs and triggers)              |
| Docs     | OpenAPI 3 + Swagger UI at `/api/docs`                                          |
| Testing  | Jest + Supertest (backend), Vitest (frontend)                                  |
| Frontend | React 18, Vite, TanStack Query, React Router, React Hook Form, Tailwind CSS v4 |
| Tooling  | npm workspaces, ESLint, Prettier, Husky, lint-staged, Commitlint               |
| Infra    | Docker Compose                                                                 |

## Run locally

### Prerequisites

- Node.js 20+ and npm 10+
- Docker with Docker Compose

### Option A: Docker (one command)

```bash
git clone <repo-url> ledger && cd ledger
docker compose up --build
```

The API container applies migrations and seeds three demo accounts on start. No `.env` files
are needed.

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:5173          |
| API      | http://localhost:4000/api/v1   |
| Swagger  | http://localhost:4000/api/docs |

Ports already in use? Override any of them:

```bash
API_PORT=4100 WEB_PORT=5180 POSTGRES_PORT=55432 POSTGRES_TEST_PORT=55433 docker compose up --build
```

Set `SEED_DEMO_DATA=false` to start with an empty database. Stop with
`docker compose down`, adding `-v` to also delete the data.

### Option B: Manual (for development)

```bash
# 1. Install all workspaces (from the repository root)
npm install

# 2. Start PostgreSQL (main + test databases)
docker compose up -d postgres postgres-test

# 3. Configure environments
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Create the schema and load demo data
npm run db:migrate:deploy -w backend
npm run db:seed -w backend

# 5. Run the API and the frontend (two terminals)
npm run dev -w backend     # http://localhost:4000
npm run dev -w frontend    # http://localhost:5173
```

If you changed `POSTGRES_PORT` / `POSTGRES_TEST_PORT`, update `DATABASE_URL` /
`TEST_DATABASE_URL` in `backend/.env` to match.

### Option C: Deploy to Render

The repository includes a [Render Blueprint](render.yaml) that creates three resources: the API
(Docker), a PostgreSQL database and the frontend (static site).

1. In Render, choose **New → Blueprint** and select this repository. When prompted, enter
   placeholder values for `CORS_ORIGIN` and `VITE_API_BASE_URL`.
2. After the first deploy, copy the two service URLs and set:
   - `ledger-api` → `CORS_ORIGIN` = the frontend URL, e.g. `https://ledger-web.onrender.com`
   - `ledger-web` → `VITE_API_BASE_URL` = the API URL + `/api/v1`, e.g.
     `https://ledger-api.onrender.com/api/v1`
3. Redeploy both services. The frontend must be rebuilt, because Vite inlines the API URL.

The API applies migrations on every start and seeds the demo accounts (`SEED_DEMO_DATA`).

> **Created the API service by hand?** Its Docker build context must be the **repository
> root**, because the workspaces share one lockfile. In the service settings, set
> _Root Directory_ to empty, _Dockerfile Path_ to `./backend/Dockerfile` and _Docker Build
> Context Directory_ to `.`. A `backend/` context fails with
> `"/backend/docker-entrypoint.sh": not found`.

### Environment variables

| Variable                                                      | Where    | Default / example                                       | Description                          |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------- | ------------------------------------ |
| `NODE_ENV`                                                    | backend  | `development`                                           | `development`, `test`, `production`  |
| `PORT`                                                        | backend  | `4000`                                                  | API port                             |
| `DATABASE_URL`                                                | backend  | `postgresql://ledger:ledger@localhost:5432/ledger`      | Main database                        |
| `TEST_DATABASE_URL`                                           | backend  | `postgresql://ledger:ledger@localhost:5433/ledger_test` | Database used by the test suite      |
| `LOG_LEVEL`                                                   | backend  | `info`                                                  | Pino log level                       |
| `CORS_ORIGIN`                                                 | backend  | `http://localhost:5173`                                 | Allowed frontend origin              |
| `VITE_API_BASE_URL`                                           | frontend | `http://localhost:4000/api/v1`                          | Frontend → API base URL (build time) |
| `VITE_CURRENCY`                                               | frontend | `INR`                                                   | ISO 4217 code used to display money  |
| `POSTGRES_PORT`, `POSTGRES_TEST_PORT`, `API_PORT`, `WEB_PORT` | compose  | `5432`, `5433`, `4000`, `5173`                          | Host ports                           |
| `SEED_DEMO_DATA`                                              | compose  | `true`                                                  | Seed demo accounts on API start      |

The backend validates its environment with Zod at boot and exits with a clear message if
anything is missing or malformed.

## API

Base URL `http://localhost:4000/api/v1`. See the **[API quick reference](docs/API.md)** for
curl examples, the **Swagger UI** at <http://localhost:4000/api/docs>, or import the
**[Postman collection](docs/postman/ledger.postman_collection.json)**.

| Method | Endpoint                            | Success | Notes                                |
| ------ | ----------------------------------- | ------- | ------------------------------------ |
| `GET`  | `/health`                           | `200`   | App + DB status                      |
| `POST` | `/accounts`                         | `201`   | Create account (balance starts at 0) |
| `GET`  | `/accounts`                         | `200`   | Paginated, newest first              |
| `GET`  | `/accounts/:accountId`              | `200`   | Account + current balance            |
| `POST` | `/transactions`                     | `201`   | Credit or debit; returns new balance |
| `GET`  | `/transactions/:transactionId`      | `200`   | Single transaction                   |
| `GET`  | `/accounts/:accountId/transactions` | `200`   | Paginated, latest first              |
| `POST` | `/transfers`                        | `201`   | Atomic transfer between two accounts |

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01",
    "type": "debit",
    "amount": 30,
    "reference_id": "INV-1001",
    "description": "Office supplies"
  }'
```

Every response uses one envelope: `{ "success": true, "data", "meta"? }` or
`{ "success": false, "error": { "code", "message", "details"? } }`. The full list of error
codes is in [docs/API.md](docs/API.md#error-codes).

## Architecture

### Request flow

```
Route ─► Validate (Zod) ─► Controller ─► Service ─► Repository ─► PostgreSQL
                                            │
                                 business rules + DB transaction
```

| Layer          | Does                                                                      | Does not               |
| -------------- | ------------------------------------------------------------------------- | ---------------------- |
| **Route**      | Maps verb + path to a controller, attaches validators and 405             | Contain logic          |
| **Controller** | Reads the validated request, calls the service, shapes HTTP               | Talk to the database   |
| **Service**    | Business rules, locking, atomic operations                                | Know about `req`/`res` |
| **Repository** | Data access only                                                          | Contain business rules |
| **Mapper**     | Model → API response (`camelCase` → `snake_case`, minor units → `"0.00"`) | Hold logic             |

### Project structure

```
ledger/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/            # init + raw SQL constraints & immutability triggers
│   │   └── seed.ts                # idempotent demo data
│   ├── src/
│   │   ├── config/                # Zod-validated env, Pino logger
│   │   ├── db/                    # Prisma client, transaction options
│   │   ├── docs/                  # openapi.yaml + Swagger UI router
│   │   ├── modules/
│   │   │   ├── account/           # routes · controller · service · repository · schema · mapper
│   │   │   ├── transaction/       # … same layout
│   │   │   ├── transfer/          # … same layout
│   │   │   └── health/
│   │   ├── shared/
│   │   │   ├── errors/            # AppError, error codes, Zod/Prisma error mapping
│   │   │   ├── middlewares/       # request-id, logger, validation, 405, 404, error handler
│   │   │   └── utils/             # money, amount schema, pagination, response envelope
│   │   ├── app.ts                 # Express app (no listen); used by tests
│   │   ├── routes.ts
│   │   └── server.ts              # bootstrap + graceful shutdown
│   ├── tests/{unit,integration,helpers}/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios client, error mapping, endpoint functions
│   │   ├── components/{ui,layout}/  # design-system primitives, app shell
│   │   ├── features/              # accounts · transactions · transfers
│   │   ├── hooks/  lib/  pages/  types/
│   │   └── main.tsx
│   ├── Dockerfile  nginx.conf
├── docs/                          # API.md, ASSUMPTIONS.md, Postman collection
└── docker-compose.yml
```

### Data model

```
accounts                        transactions                          transfers
────────────────────────        ──────────────────────────────────    ─────────────────────────
id          UUID PK      ◄────  account_id    UUID FK                 id              UUID PK
name        VARCHAR(100)        id            UUID PK                 from_account_id UUID FK
balance     BIGINT ≥ 0          type          credit | debit          to_account_id   UUID FK
created_at  TIMESTAMPTZ         amount        BIGINT > 0              amount          BIGINT > 0
updated_at  TIMESTAMPTZ         description   VARCHAR(255) NULL       reference_id    UNIQUE
                                reference_id  VARCHAR(64)             description     NULL
                                transfer_id   UUID FK NULL  ────────► created_at
                                created_at    TIMESTAMPTZ             CHECK (from <> to)
                                UNIQUE (account_id, reference_id)
                                INDEX  (account_id, created_at DESC, id DESC)
```

`transactions` and `transfers` are protected by the `prevent_transaction_mutation` trigger.

### Frontend

- **Accounts dashboard:** balance cards and a create-account dialog.
- **Account detail:** balance header and paginated history with credit/debit/transfer tags.
- **New transaction:** dialog with a credit/debit toggle and inline validation.
- **Transfer:** select accounts, review the balances before/after, confirm, and get a receipt.
- **Errors:** API errors become toasts, and field-level errors appear inline. TanStack Query
  refreshes every balance after each mutation.

## Testing

Tests run against the dedicated test database (`TEST_DATABASE_URL`), which is migrated
automatically before the integration suites.

```bash
docker compose up -d postgres-test

npm test                                # all workspaces
npm run test:unit -w backend
npm run test:integration -w backend
npm run test:coverage -w backend
npm test -w frontend                    # Vitest
```

Quality gates run on every commit through Husky: ESLint (zero warnings) and Prettier on
staged files, plus Commitlint (Conventional Commits).

```bash
npm run lint
npm run format:check
```

## Code standards

| Area       | Standard                                                                               |
| ---------- | -------------------------------------------------------------------------------------- |
| Naming     | `kebab-case` files, `camelCase` code, `PascalCase` types, `UPPER_SNAKE_CASE` constants |
| Types      | Strict TypeScript, no `any`; request types inferred from Zod schemas                   |
| Errors     | Always `AppError` with a code from `error-codes.ts`; raw errors never reach clients    |
| API fields | `snake_case` JSON, `camelCase` in code, converted in mappers                           |
| Comments   | Explain _why_, not _what_                                                              |
| Commits    | Conventional Commits, e.g. `feat(transactions): add atomic debit flow`                 |

## Assumptions

See [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) for every decision made where the brief was
silent, covering money format and limits, reference-ID semantics, transfer references,
ordering and pagination.

## Future improvements

- Authentication (JWT) and per-user account ownership
- An `Idempotency-Key` header that replays the original response for safe client retries
- Cursor-based pagination for very large histories
- Multi-currency support with exchange rates
- Rate limiting and an audit log
- A CI pipeline (GitHub Actions) running lint, tests and builds on every PR
