# syntax=docker/dockerfile:1.7

# Versi Node di-pin, selaras dengan .nvmrc (24).
ARG NODE_VERSION=24.11.1

# ---------- deps: hanya manifest, agar cache install optimal ----------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
# pnpm diaktifkan lewat corepack; versinya dibaca dari field "packageManager" di package.json.
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- builder ----------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN corepack enable
# Build-time: di-inline Vite ke bundle browser, jadi harus tersedia saat build.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV DEPLOY_TARGET=node
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Typecheck dan lint dijalankan di CI; di sini cukup build.
RUN pnpm exec vite build

# ---------- runner ----------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    HOST=0.0.0.0 \
    PORT=3000

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
# Output Nitro sudah self-contained (dependency ikut ter-bundle), jadi tidak perlu node_modules.
COPY --from=builder --chown=app:app /app/.output ./.output
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

CMD ["node", ".output/server/index.mjs"]
