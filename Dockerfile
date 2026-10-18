ARG NODE_VERSION=24.22.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Next.js reports usage to Vercel from every build unless told not to.
ENV NEXT_TELEMETRY_DISABLED=1
# .next/cache is build cache that `next start` does not need. Copied into the
# image, it changes with every build and is carried over on every deploy.
RUN npm run build && rm -rf .next/cache

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder --chown=node:node /app/.next ./.next
# The manifest's icons, served at fixed paths.
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts /app/google-client-id.env ./
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
# `docker compose up --wait` in bin/deploy-prod waits for this.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
USER node
ENTRYPOINT ["node_modules/.bin/next", "start"]
