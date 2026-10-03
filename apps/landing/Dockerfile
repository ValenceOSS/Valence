# syntax=docker/dockerfile:1

# getvalence.app is a static marketing site, not the product — it has no need
# of the root Dockerfile's transcoder or server stages, and living in its own
# file here means a platform that auto-detects a Dockerfile at the repo root
# (Railway among them) can be pointed at this one for this service alone,
# leaving the root Dockerfile untouched for whoever deploys the product itself.

FROM node:24-bookworm-slim AS build
WORKDIR /build
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json tsconfig.json tsconfig.paths.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile

# `tsc --build`'s incremental state has nothing to compare against in a
# container that never held a previous build, but plain `tsc --build` here
# still intermittently skips emitting a few declaration files, which
# `vite build` then trips over as a project-reference error. A one-shot
# build has no reason to trust incremental state anyway, so both projects
# are forced instead of run through their ordinary, incremental scripts.
RUN pnpm --filter @valence/ui exec tsc --build --force
RUN pnpm --filter @valence/landing exec tsc --build --force
RUN pnpm --filter @valence/landing exec vite build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN npm install --global serve@14.2.6
COPY --from=build /build/apps/landing/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve dist -l ${PORT:-3000}"]
