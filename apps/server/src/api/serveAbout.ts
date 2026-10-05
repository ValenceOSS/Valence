import { aboutRoute } from '@ValenceServer/routes/AboutRoute';
import { SERVER_FEATURES } from '@ValenceContracts/constants/SERVER_FEATURES';
import type { AppContext } from '@ValenceServer/api/AppContext';
import { closedAppsIn } from '@ValenceServer/access/closedAppsIn';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the about endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAbout = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION, SERVER_COMMIT, demoAccounts, settings } = context;

  app.openapi(aboutRoute, async (asked) => {
    const closedApps = closedAppsIn((await settings.read()).allowedApps);

    return asked.json(
      {
        version: SERVER_VERSION,
        commit: SERVER_COMMIT,
        features: [...SERVER_FEATURES],
        ...(demoAccounts.length > 0 ? { isDemo: true } : {}),
        ...(closedApps.length > 0 ? { closedApps } : {}),
      },
      200,
    );
  });
};

export { serveAbout };
