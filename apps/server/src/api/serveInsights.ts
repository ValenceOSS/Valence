import {
  libraryHealthRoute,
  statisticsRoute,
  updateCheckRoute,
} from '@ValenceServer/routes/InsightsRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the endpoints that tell an administrator how the server is used and kept: what was
 * watched and how it was delivered, what is wrong in the libraries, and whether a newer release is
 * out.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveInsights = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, statistics, readLibraryHealth, updates } = context;

  app.openapi(statisticsRoute, async (asked) => {
    if (!(await requires(asked.req.raw.headers, 'server.monitor'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { range, zone } = asked.req.valid('query');

    return asked.json(await statistics.read(range, zone), 200);
  });

  app.openapi(libraryHealthRoute, async (asked) => {
    if (!(await requires(asked.req.raw.headers, 'library.edit'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return asked.json(await readLibraryHealth(), 200);
  });

  app.openapi(updateCheckRoute, async (asked) => {
    if (!(await requires(asked.req.raw.headers, 'server.monitor'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return asked.json(await updates.read(asked.req.valid('query').now === 'true'), 200);
  });
};

export { serveInsights };
