# syntax=docker/dockerfile:1
# Build context: repository root (npm workspaces share one lockfile).
#   docker build -f frontend/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend --ignore-scripts
COPY frontend/ frontend/
# Vite inlines these at build time, so they are build arguments, not runtime env.
ARG VITE_API_BASE_URL=http://localhost:4000/api/v1
ARG VITE_CURRENCY=INR
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_CURRENCY=$VITE_CURRENCY
RUN npm run build -w frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
