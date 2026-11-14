import { Hono } from 'hono';
import { createJellyfinBrowsing } from '@ValenceServer/jellyfin/createJellyfinBrowsing';
import { createJellyfinIds } from '@ValenceServer/jellyfin/createJellyfinIds';
import { createJellyfinPlays } from '@ValenceServer/jellyfin/createJellyfinPlays';
import { lowerKeysOf } from '@ValenceServer/jellyfin/lowerKeysOf';
import { registerJellyfinBrowsing } from '@ValenceServer/jellyfin/registerJellyfinBrowsing';
import { registerJellyfinImages } from '@ValenceServer/jellyfin/registerJellyfinImages';
import { registerJellyfinPlayback } from '@ValenceServer/jellyfin/registerJellyfinPlayback';
import { registerJellyfinProgress } from '@ValenceServer/jellyfin/registerJellyfinProgress';
import { registerJellyfinSystem } from '@ValenceServer/jellyfin/registerJellyfinSystem';
import { registerJellyfinUsers } from '@ValenceServer/jellyfin/registerJellyfinUsers';
import type { JellyfinEnv } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend, JellyfinOrigin } from '@ValenceServer/jellyfin/JellyfinBackend';

/**
 * Builds the Jellyfin endpoints, answered with what is given, so they can be tried against a
 * stand-in for Valence. Each request is answered for the app that sent it, as the session its
 * token stands for, where it carries one.
 *
 * @param backend - What they are answered with.
 * @returns How to answer a request, already matched by the path `jellyfinRouteOf` makes, for the
 *   app that sent it.
 */
const createJellyfinApp = (backend: JellyfinBackend) => {
  const jellyfin = new Hono<JellyfinEnv>();
  const ids = createJellyfinIds(backend);
  const browsing = createJellyfinBrowsing(backend, ids);
  const plays = createJellyfinPlays();
  const origins = new WeakMap<Request, JellyfinOrigin>();

  jellyfin.use('*', async (context, next) => {
    const origin = origins.get(context.req.raw);

    if (origin === undefined) {
      return context.body(null, 404);
    }

    context.set('origin', origin);
    context.set('query', lowerKeysOf(context.req.queries()));
    context.set(
      'caller',
      origin.client.token === null ? null : await backend.callerOf(origin.client.token, origin),
    );

    await next();

    return undefined;
  });

  registerJellyfinSystem(jellyfin, backend);
  registerJellyfinUsers(jellyfin, backend);
  registerJellyfinBrowsing(jellyfin, browsing);
  registerJellyfinImages(jellyfin, backend, browsing);
  registerJellyfinPlayback(jellyfin, backend, plays);
  registerJellyfinProgress(jellyfin, backend, browsing, plays);

  jellyfin.notFound((context) => context.body(null, 404));

  return {
    answer: async (request: Request, origin: JellyfinOrigin): Promise<Response> => {
      origins.set(request, origin);

      return jellyfin.fetch(request);
    },
  };
};

export { createJellyfinApp };
