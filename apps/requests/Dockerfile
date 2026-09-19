# syntax=docker/dockerfile:1

# The requests service, as an image of its own. It is optional: a server that never runs it never
# pulls it, and Valence shows nothing about requesting until REQUESTS_URL and REQUESTS_SECRET are
# both set. Built from the repository root, since it shares the contracts with the server.

FROM node:24-bookworm-slim AS build
WORKDIR /build
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json tsconfig.json tsconfig.paths.json ./
COPY packages/contracts ./packages/contracts
COPY apps/requests ./apps/requests
RUN pnpm install --frozen-lockfile --filter @valence/requests...

# Bundled for the same reason the server is: the imports are path aliases Node cannot resolve.
RUN pnpm --filter @valence/requests bundle

FROM node:24-bookworm-slim AS runtime

ARG VALENCE_VERSION=0.0.0

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY apps/requests/package.json ./apps/requests/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @valence/requests...

COPY apps/requests/drizzle ./apps/requests/drizzle
COPY --from=build /build/apps/requests/dist ./apps/requests/dist

ENV NODE_ENV=production \
    REQUESTS_PORT=8421 \
    VALENCE_VERSION=${VALENCE_VERSION}

EXPOSE 8421

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:8421/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/requests/dist/Main.js"]
