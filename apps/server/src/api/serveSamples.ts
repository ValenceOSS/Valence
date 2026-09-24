import { findASampleRoute } from '@ValenceServer/routes/SampleRoute';
import { findASample } from '@ValenceServer/samples/findASample';
import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from '@ValenceServer/api/AppContext';

const KEPT_FOR = 24 * 60 * 60 * 1000;

const MOST_KEPT = 500;

/**
 * Registers the endpoint that finds a sample of an album to hear before asking for it, for whoever
 * may ask for music. What was found is remembered for a day, so a page of albums asks once each.
 *
 * @param app - The application to register it on.
 * @param context - What it is answered with.
 */
const serveSamples = (app: OpenAPIHono, context: AppContext): void => {
  const { requires } = context;
  const found = createExpiringCache<string | null>(KEPT_FOR, { holds: MOST_KEPT });

  app.openapi(findASampleRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'requests.askMusic'))) {
      return context.json({ error: 'That is for somebody who may ask for music.' }, 403);
    }

    const { artist, album } = context.req.valid('query');
    const key = `${artist}\n${album}`;
    const known = found.get(key);
    const url =
      known === undefined
        ? await findASample(
            (address) => fetch(address, { signal: AbortSignal.timeout(5000) }),
            artist,
            album,
          )
        : known;

    found.set(key, url);

    return context.json({ url }, 200);
  });
};

export { serveSamples };
