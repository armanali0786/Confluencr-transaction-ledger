#!/bin/sh
set -e

npx prisma migrate deploy

# The seed is idempotent (existing demo accounts are skipped), so restarts are safe.
if [ "$SEED_DEMO_DATA" = "true" ]; then
  npx prisma db seed
fi

exec node dist/server.js
