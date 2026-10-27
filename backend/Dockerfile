# syntax=docker/dockerfile:1
# Build context: repository root (npm workspaces share one lockfile).
#   docker build -f backend/Dockerfile .

FROM node:20-alpine AS build
# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# Scripts are skipped: husky needs .git and `prisma generate` needs the schema copied below.
RUN npm ci --workspace backend --ignore-scripts
COPY backend/ backend/
RUN npm run db:generate -w backend && npm run build -w backend

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
# The Prisma CLI (migrations) and tsx (optional demo seed) run at startup, so the
# runtime keeps the workspace's full dependency tree.
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/package.json /app/backend/prisma.config.ts /app/backend/tsconfig.json ./backend/
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/src ./backend/src
COPY --from=build /app/backend/dist ./backend/dist
COPY --chmod=755 backend/docker-entrypoint.sh ./backend/
WORKDIR /app/backend
USER node
EXPOSE 4000
# Platforms such as Render inject their own PORT, so the check follows it.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/v1/health" > /dev/null || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
