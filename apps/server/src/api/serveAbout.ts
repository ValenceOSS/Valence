import { aboutRoute } from '@ValenceServer/routes/AboutRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the about endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAbout = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION, SERVER_COMMIT } = context;

  app.openapi(aboutRoute, (asked) =>
    asked.json({ version: SERVER_VERSION, commit: SERVER_COMMIT }, 200),
  );
};

export { serveAbout };
