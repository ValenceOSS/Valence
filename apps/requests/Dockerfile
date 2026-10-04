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
COPY packages/core ./packages/core
COPY packages/i18n ./packages/i18n
COPY packages/database ./packages/database
COPY apps/requests ./apps/requests
RUN pnpm install --frozen-lockfile --filter @valence/requests...

# Bundled for the same reason the server is: the imports are path aliases Node cannot resolve.
RUN pnpm --filter @valence/requests bundle

# An alias whose package was not copied in above does not fail the bundle: esbuild cannot resolve
# it, takes it for a package from npm, and leaves the import for Node to find at start-up. So the
# build refuses one here instead, where it is a failed build rather than a service that will not start.
RUN if grep -Eo "from ?[\"']@Valence[A-Za-z]+/[^\"']+" apps/requests/dist/*.js; then \
      echo "unbundled path alias in apps/requests/dist; copy its package into the build stage" >&2; exit 1; \
    fi

# The browser that gets indexers past Cloudflare's check, Camoufox, at a release chosen here rather
# than the newest one. camoufox-js fetches the newest release it allows, and allows every one, so a
# Camoufox release the library does not yet understand stops the browser starting in every image built
# after it, as 156 did. A newer release goes in once the camoufox-js pinned in package.json starts one.
# It always passes for Firefox on Linux, which is what the traffic underneath it shows anyway, and
# never looks up where it is, so the fonts it would need to pass for Windows or a Mac and the map of
# addresses to places are left out.
FROM node:24-bookworm-slim AS browser
ARG TARGETARCH
ARG CAMOUFOX_VERSION=152.0.4
ARG CAMOUFOX_RELEASE=beta.30
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl unzip \
 && rm -rf /var/lib/apt/lists/*
RUN case "$TARGETARCH" in \
      amd64) arch=x86_64; sum=5720d45b894ce1770543de024c6f10d514b38be560fa2dc3226b3d8586caf672 ;; \
      arm64) arch=arm64; sum=60447260af8bebdb0ec3f2aa72f687b879e5598367303de2e3fdbc7a5be8c124 ;; \
      *) echo "Camoufox has no Linux build for $TARGETARCH" >&2; exit 1 ;; \
    esac \
 && curl -fsSL -o /tmp/camoufox.zip \
      "https://github.com/daijro/camoufox/releases/download/v$CAMOUFOX_VERSION-$CAMOUFOX_RELEASE/camoufox-$CAMOUFOX_VERSION-$CAMOUFOX_RELEASE-lin.$arch.zip" \
 && echo "$sum  /tmp/camoufox.zip" | sha256sum -c - \
 && unzip -q /tmp/camoufox.zip -d /opt/camoufox \
 && rm -rf /tmp/camoufox.zip /opt/camoufox/fonts/windows /opt/camoufox/fonts/macos /opt/camoufox/GeoLite2-City.mmdb \
 && printf '{"version":"%s","release":"%s"}' "$CAMOUFOX_VERSION" "$CAMOUFOX_RELEASE" > /opt/camoufox/version.json \
 && chmod -R 755 /opt/camoufox

FROM node:24-bookworm-slim AS runtime

ARG VALENCE_VERSION=0.0.0

# What Firefox needs to run without a screen: the browser that gets indexers past Cloudflare's
# check lives in this service rather than in a container of its own.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates libgtk-3-0 libx11-xcb1 libasound2 libdbus-glib-1-2 libxt6 libxtst6 libpci3 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/i18n ./packages/i18n
COPY packages/database ./packages/database
COPY apps/requests/package.json ./apps/requests/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @valence/requests...

# The browser, and the addons camoufox-js adds to it, in the image so that nothing waits on a download.
ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox
COPY --from=browser /opt/camoufox /opt/camoufox
RUN cd apps/requests \
 && node --input-type=module -e "import { DefaultAddons, maybeDownloadAddons } from 'camoufox-js/dist/addons.js'; await maybeDownloadAddons(DefaultAddons)" \
 && test -f /opt/camoufox/addons/UBO/manifest.json

# Camoufox opens a SQLite file every time it starts, through better-sqlite3's compiled module, and
# the install above runs no scripts to build one. The version pinned in pnpm-workspace.yaml carries
# its own. Loading it here, as camoufox-js does, fails the build rather than the first Cloudflare
# check if a version without one is ever pinned again.
RUN node -e "const camoufox = require('node:fs').realpathSync('/app/apps/requests/node_modules/camoufox-js/package.json'); new (require('node:module').createRequire(camoufox)('better-sqlite3'))(':memory:').close()"

COPY apps/requests/drizzle/postgres ./apps/requests/drizzle/postgres
COPY apps/requests/drizzle/mysql ./apps/requests/drizzle/mysql
COPY --from=build /build/apps/requests/dist ./apps/requests/dist

ENV NODE_ENV=production \
    REQUESTS_PORT=8421 \
    VALENCE_VERSION=${VALENCE_VERSION}

EXPOSE 8421

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:8421/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/requests/dist/Main.js"]
