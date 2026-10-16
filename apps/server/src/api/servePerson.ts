import { splitPersonCredits } from '@ValenceServer/library/splitPersonCredits';
import {
  findPeopleRoute,
  readPersonRoute,
  readPersonCreditsRoute,
} from '@ValenceServer/routes/PersonRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const PEOPLE_FOUND = 12;

/**
 * Registers the person endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePerson = (app: OpenAPIHono, context: AppContext): void => {
  const { library, viewerOf, readProfileId } = context;

  app.openapi(findPeopleRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { search, limit } = context.req.valid('query');

    return context.json(
      { people: await library.findPeople(viewer, search, limit ?? PEOPLE_FOUND) },
      200,
    );
  });

  app.openapi(readPersonRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const found = await library.readPerson(context.req.valid('param').personId);

    if (found === null) {
      return context.json(refuse('error.person.theCatalogueKnowsNobodyByThat'), 404);
    }

    return context.json(found, 200);
  });

  app.openapi(readPersonCreditsRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const held = await library.findByPerson(viewer, context.req.valid('param').personId);

    return context.json(splitPersonCredits(held), 200);
  });
};

export { servePerson };
