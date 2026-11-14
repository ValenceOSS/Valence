import { createJellyfinApp } from '@ValenceServer/jellyfin/createJellyfinApp';
import { JELLYFIN_BASE_PATH } from '@ValenceServer/jellyfin/JELLYFIN_BASE_PATH';
import { jellyfinBackendOf } from '@ValenceServer/jellyfin/jellyfinBackendOf';
import { jellyfinRouteOf } from '@ValenceServer/jellyfin/jellyfinRouteOf';
import { lowerKeysOf } from '@ValenceServer/jellyfin/lowerKeysOf';
import { readJellyfinClient } from '@ValenceServer/jellyfin/readJellyfinClient';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const MOST_BODY_BYTES = 1_000_000;

/**
 * Registers Valence answering as a Jellyfin server under `/jellyfin`, so Jellyfin's own apps can
 * add it, sign in, browse, play and keep their place. Each request is matched whatever the case of
 * its address, and answered as the Valence session its token stands for, through the same services
 * and endpoints Valence's own apps use, which are asked from here with the request's own address.
 *
 * @param app - The application to register it on, which is also where Valence's endpoints are
 *   asked on the Jellyfin app's behalf.
 * @param context - What Valence answers with.
 */
const serveJellyfin = (app: OpenAPIHono, context: AppContext): void => {
  const jellyfin = createJellyfinApp(jellyfinBackendOf(context));

  app.all(JELLYFIN_BASE_PATH, (asked) => asked.redirect(`${JELLYFIN_BASE_PATH}/`, 302));

  app.all(`${JELLYFIN_BASE_PATH}/*`, async (asked) => {
    const raw = asked.req.raw;
    const url = new URL(raw.url);
    const hasBody = raw.method !== 'GET' && raw.method !== 'HEAD';
    const body = hasBody ? await raw.arrayBuffer() : null;

    if (body !== null && body.byteLength > MOST_BODY_BYTES) {
      return asked.body(null, 413);
    }

    const routed = new Request(new URL(`${jellyfinRouteOf(url.pathname)}${url.search}`, url), {
      method: raw.method,
      headers: raw.headers,
      ...(body === null ? {} : { body }),
    });

    return jellyfin.answer(routed, {
      url: raw.url,
      headers: raw.headers,
      client: readJellyfinClient(raw.headers, lowerKeysOf(asked.req.queries())),
      send: async (request: Request) => app.fetch(request, asked.env),
    });
  });
};

export { serveJellyfin };
