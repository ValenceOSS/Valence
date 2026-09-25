# syntax=docker/dockerfile:1

# The documentation site is static, so it has no need of the root Dockerfile's transcoder or
# server runtime. It does need the server's source at build time: the API reference is read off the
# route declarations, and the `spec` script writes them to a file the site serves.

FROM node:24-bookworm-slim AS build
WORKDIR /build
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY patches ./patches
COPY tsconfig.base.json tsconfig.json tsconfig.paths.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @valence/ui exec tsc --build --force
RUN pnpm --filter @valence/docs run spec
RUN pnpm --filter @valence/docs exec tsc --build --force
RUN pnpm --filter @valence/docs exec vite build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN npm install --global serve@14.2.6
COPY --from=build /build/apps/docs/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
