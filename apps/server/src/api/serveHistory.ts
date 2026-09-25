import { say } from '@ValenceI18n/say';
import {
  listHistoryRoute,
  forgetViewingRoute,
  forgetHistoryRoute,
} from '@ValenceServer/routes/HistoryRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the history endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveHistory = (app: OpenAPIHono, context: AppContext): void => {
  const { history, viewerOf, readProfileId } = context;

  app.openapi(listHistoryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    const viewer = await viewerOf(context.req.raw.headers);

    if (profileId === null || viewer === null || history === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { limit, offset } = context.req.valid('query');

    return context.json(
      {
        viewings: await history.list(viewer, profileId, {
          ...(limit === undefined ? {} : { limit }),
          ...(offset === undefined ? {} : { offset }),
        }),
      },
      200,
    );
  });

  app.openapi(forgetViewingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || history === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    if (!(await history.forget(profileId, context.req.valid('param').id))) {
      return context.json({ error: say('server.errors.noSuchViewing') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(forgetHistoryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || history === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ forgotten: await history.forgetAll(profileId) }, 200);
  });
};

export { serveHistory };
