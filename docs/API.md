# API Quick Reference

Base URL: `http://localhost:4000/api/v1`

- Interactive docs (Swagger UI): <http://localhost:4000/api/docs>
- OpenAPI document: <http://localhost:4000/api/docs/openapi.json> (source:
  [`backend/src/docs/openapi.yaml`](../backend/src/docs/openapi.yaml))
- Postman collection: [`docs/postman/ledger.postman_collection.json`](postman/ledger.postman_collection.json)

## Conventions

| Topic        | Rule                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Fields       | `snake_case` JSON                                                                                          |
| Money in     | Number or numeric string, `> 0`, at most 2 decimals, max `1000000000.00`                                   |
| Money out    | Always a 2-decimal string, e.g. `"100.00"`                                                                 |
| Success      | `{ "success": true, "data": …, "meta"?: … }`                                                               |
| Error        | `{ "success": false, "error": { "code", "message", "details"? } }`                                         |
| Pagination   | `?page=1&limit=10` (limit max 100); `meta` has `current_page`, `page_size`, `total_records`, `total_pages` |
| Tracing      | Every response has an `X-Request-Id` header; a valid incoming one is echoed back                           |
| Immutability | `PUT`/`PATCH`/`DELETE` on transactions and transfers return `405` with an `Allow` header                   |

## Endpoints

| Method | Endpoint                            | Success | Notes                                      |
| ------ | ----------------------------------- | ------- | ------------------------------------------ |
| `GET`  | `/health`                           | `200`   | App and database status (`503` if DB down) |
| `POST` | `/accounts`                         | `201`   | Create account (balance starts at 0)       |
| `GET`  | `/accounts`                         | `200`   | Paginated, newest first                    |
| `GET`  | `/accounts/:accountId`              | `200`   | Account with current balance               |
| `POST` | `/transactions`                     | `201`   | Credit or debit; returns the new balance   |
| `GET`  | `/transactions/:transactionId`      | `200`   | Single transaction                         |
| `GET`  | `/accounts/:accountId/transactions` | `200`   | Paginated, latest first                    |
| `POST` | `/transfers`                        | `201`   | Atomic transfer between two accounts       |

## Examples

The examples use the seeded demo accounts. Run `npm run db:seed -w backend`, or start with
Docker, which seeds by default.

```bash
API=http://localhost:4000/api/v1
ALICE=6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01
BOB=6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a02
```

### Health

```bash
curl -s $API/health
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "up",
    "uptime_seconds": 42,
    "timestamp": "2026-01-15T10:00:00.000Z"
  }
}
```

### Create an account

```bash
curl -s -X POST $API/accounts \
  -H "Content-Type: application/json" \
  -d '{ "name": "Operating account" }'
```

```json
{
  "success": true,
  "data": {
    "id": "0d1f6c5e-8a52-4b0e-9c51-6f9a1c2b3d4e",
    "name": "Operating account",
    "balance": "0.00",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
}
```

### List accounts / get one account

```bash
curl -s "$API/accounts?page=1&limit=10"
curl -s $API/accounts/$ALICE
```

### Create a transaction

```bash
curl -s -X POST $API/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "'$ALICE'",
    "type": "debit",
    "amount": 30,
    "reference_id": "INV-1001",
    "description": "Office supplies"
  }'
```

The response contains the created ledger entry **and** the account with its new balance:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "94f5ec8d-73d7-4485-a6b2-b94486aaa034",
      "account_id": "6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01",
      "type": "debit",
      "amount": "30.00",
      "description": "Office supplies",
      "reference_id": "INV-1001",
      "transfer_id": null,
      "created_at": "2026-01-15T10:05:00.000Z"
    },
    "account": {
      "id": "6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01",
      "name": "Alice Operating Account",
      "balance": "669.51",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-15T10:05:00.000Z"
    }
  }
}
```

Sending the same request again returns `409 DUPLICATE_TRANSACTION` and leaves the balance
unchanged.

### Transaction history

```bash
curl -s "$API/accounts/$ALICE/transactions?page=1&limit=10"
curl -s $API/transactions/<transaction-id>
```

### Transfer money

```bash
curl -s -X POST $API/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "from_account_id": "'$ALICE'",
    "to_account_id": "'$BOB'",
    "amount": "30.00",
    "reference_id": "TRF-2001",
    "description": "Rent share"
  }'
```

The response contains `transfer`, both ledger entries (`transactions.debit` and
`transactions.credit`, linked by `transfer_id`) and both accounts with their new balances
(`accounts.from` and `accounts.to`).

### Error responses

```bash
# 400: field-level validation details
curl -s -X POST $API/transactions -H "Content-Type: application/json" \
  -d '{ "account_id": "'$ALICE'", "type": "debit", "amount": 0, "reference_id": "X" }'
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "amount", "message": "amount must be greater than 0" }]
  }
}
```

```bash
# 405: transactions are immutable
curl -s -i -X DELETE $API/transactions/<transaction-id>
```

## Error codes

| HTTP  | Code                    | When                                                      |
| ----- | ----------------------- | --------------------------------------------------------- |
| `400` | `VALIDATION_ERROR`      | Invalid or missing fields, unknown fields, malformed UUID |
| `400` | `INVALID_REQUEST_BODY`  | Malformed JSON                                            |
| `400` | `INVALID_PAGINATION`    | `page`/`limit` not an integer, `< 1`, or `limit > 100`    |
| `400` | `SAME_ACCOUNT_TRANSFER` | Transfer source equals destination                        |
| `404` | `ACCOUNT_NOT_FOUND`     | Unknown account id                                        |
| `404` | `TRANSACTION_NOT_FOUND` | Unknown transaction id                                    |
| `404` | `ROUTE_NOT_FOUND`       | Unknown endpoint                                          |
| `405` | `METHOD_NOT_ALLOWED`    | Editing or deleting a ledger record or account            |
| `409` | `DUPLICATE_TRANSACTION` | `reference_id` already used (per account / per transfer)  |
| `413` | `PAYLOAD_TOO_LARGE`     | Request body over 100kb                                   |
| `422` | `INSUFFICIENT_BALANCE`  | Debit or transfer exceeds the available balance           |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected failure (details are logged, not exposed)      |
| `503` | `SERVICE_UNAVAILABLE`   | Database unreachable                                      |
