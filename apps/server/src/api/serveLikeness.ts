import { becauseYouWatchedRoute, likeThisRoute } from '@ValenceServer/routes/LikenessRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the endpoints that find titles like others.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLikeness = (app: OpenAPIHono, context: AppContext): void => {
  const { likeness, viewerOf } = context;

  app.openapi(likeThisRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const items = await likeness?.likeThis(
      viewer,
      context.req.valid('param').id,
      context.req.valid('query').limit,
    );

    if (items === null) {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    return context.json({ items: items ?? [] }, 200);
  });

  app.openapi(becauseYouWatchedRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { rows, limit } = context.req.valid('query');

    return context.json(
      { rows: (await likeness?.becauseYouWatched(viewer, rows, limit)) ?? [] },
      200,
    );
  });
};

export { serveLikeness };
