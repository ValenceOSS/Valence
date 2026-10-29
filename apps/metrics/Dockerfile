# syntax=docker/dockerfile:1

# metrics.getvalence.app, the public statistics site. Built from the repository root so the
# workspace packages it draws with are in the context:
#
#   docker build -f apps/metrics/Dockerfile .

FROM node:24.21.0-bookworm-slim AS build
WORKDIR /build
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY patches ./patches
COPY tsconfig.base.json tsconfig.json tsconfig.paths.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile --ignore-scripts --filter "@valence/metrics..."
RUN pnpm --filter @valence/metrics exec next build

FROM node:24.21.0-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /build/apps/metrics/.next/standalone ./
COPY --from=build --chown=node:node /build/apps/metrics/.next/static ./apps/metrics/.next/static
COPY --from=build --chown=node:node /build/apps/metrics/public ./apps/metrics/public
COPY --from=build --chown=node:node /build/apps/metrics/drizzle ./apps/metrics/drizzle
WORKDIR /app/apps/metrics
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
