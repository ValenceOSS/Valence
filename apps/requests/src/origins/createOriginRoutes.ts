import { Hono } from 'hono';
import { MediaOriginsRequestSchema } from '@ValenceContracts/schemas/MediaOrigin';
import { readBody } from '@ValenceRequests/readBody';
import type { FiledOrigin, FiledOrigins } from '@ValenceContracts/schemas/MediaOrigin';
import { refuse } from '@ValenceI18n/refuse';

/**
 * The route under `/api` that tells the server which of some library files this service filed, and
 * which download client or app fetched each.
 *
 * @param filed - Reads it of some paths.
 * @returns The routes.
 */
const createOriginRoutes = (
  filed: (paths: readonly string[]) => Promise<Record<string, FiledOrigin>>,
) => {
  const routes = new Hono();

  routes.post('/origins', async (context) => {
    const asked = await readBody(context.req.raw, MediaOriginsRequestSchema);

    if (asked === null) {
      return context.json(refuse('error.requests.sayWhichFilesToAskAbout'), 400);
    }

    return context.json({ filed: await filed(asked.paths) } satisfies FiledOrigins);
  });

  return routes;
};

export { createOriginRoutes };
