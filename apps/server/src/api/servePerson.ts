import { splitPersonCredits } from '@ValenceServer/library/splitPersonCredits';
import { readPersonRoute, readPersonCreditsRoute } from '@ValenceServer/routes/PersonRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the person endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePerson = (app: OpenAPIHono, context: AppContext): void => {
  const { library, viewerOf, readProfileId } = context;

  app.openapi(readPersonRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const found = await library.readPerson(context.req.valid('param').personId);

    if (found === null) {
      return context.json({ error: 'The catalogue knows nobody by that identifier.' }, 404);
    }

    return context.json(found, 200);
  });

  app.openapi(readPersonCreditsRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const held = await library.findByPerson(viewer, context.req.valid('param').personId);

    return context.json(splitPersonCredits(held), 200);
  });
};

export { servePerson };
