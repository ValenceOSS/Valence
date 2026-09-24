import { aboutRoute } from '@ValenceServer/routes/AboutRoute';
import { serverBuildInfo } from '@ValenceServer/about/serverBuildInfo';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the about endpoints.
 *
 * @param app - The application to register them on.
 */
const serveAbout = (app: OpenAPIHono): void => {
  app.openapi(aboutRoute, (context) => context.json(serverBuildInfo(), 200));
};

export { serveAbout };
