# ── Stage 1: Build frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY src/frontend/package.json ./
RUN npm install

COPY src/frontend ./
# outDir in vite.config is ../../dist/frontend — override for Docker
RUN npx vite build --outDir /app/dist/frontend --emptyOutDir

# ── Stage 2: Build backend ────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /build/backend

COPY src/backend/package.json ./
RUN npm install

COPY src/backend ./
RUN npm run build
# compiled output is at /build/backend/dist

# ── Stage 3: Production image ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only backend production deps
COPY src/backend/package.json ./
RUN npm install --omit=dev

# Compiled backend (server.js + all modules)
COPY --from=backend-builder /build/backend/dist ./dist/backend

# Frontend build (served as static by Express via process.cwd()/dist/frontend)
COPY --from=frontend-builder /app/dist/frontend ./dist/frontend

# Template directory (mount at runtime — see docker-compose volumes)
RUN mkdir -p /app/templates /app/exports /app/generated

EXPOSE 3001

CMD ["node", "dist/backend/server.js"]
