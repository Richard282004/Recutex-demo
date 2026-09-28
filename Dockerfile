# RECUTEX storefront — Next.js. Stages: deps → dev (hot reload) | build → runner (production).
# Secrets are passed at runtime (env vars), never baked into the image.
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Development: source is bind-mounted, `next dev` hot reloads ----------
FROM deps AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- Build ----------
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# ---------- Production runner (Next.js standalone output, ~150 MB) ----------
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Product photos are mounted here (docker-compose) or synced from object storage; not baked in.
ENV MEDIA_DIR=/app/storage/media
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/data/pages ./data/pages
RUN mkdir -p /app/storage/media && chown -R app:app /app/storage
USER app
EXPOSE 3000
CMD ["node", "server.js"]
