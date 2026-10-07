import { aboutRoute } from '@ValenceServer/routes/AboutRoute';
import { SERVER_FEATURES } from '@ValenceContracts/constants/SERVER_FEATURES';
import type { AppContext } from '@ValenceServer/api/AppContext';
import { closedAppsIn } from '@ValenceServer/access/closedAppsIn';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the about endpoints.
 *
 * What the server can do, whether it is a demo and which apps it has turned away are told to anybody,
 * since an app needs them before anybody signs in. Which release and commit it runs are told only to
 * somebody signed in, so nobody scanning for servers still running a release with a known flaw can
 * read off which this one is.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAbout = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION, SERVER_COMMIT, demoAccounts, settings, askerOf } = context;

  app.openapi(aboutRoute, async (asked) => {
    const [saved, account] = await Promise.all([
      settings.read(),
      askerOf(asked.req.raw.headers).account(),
    ]);
    const closedApps = closedAppsIn(saved.allowedApps);

    return asked.json(
      {
        ...(account === null ? {} : { version: SERVER_VERSION, commit: SERVER_COMMIT }),
        features: [...SERVER_FEATURES],
        ...(demoAccounts.length > 0 ? { isDemo: true } : {}),
        ...(closedApps.length > 0 ? { closedApps } : {}),
      },
      200,
    );
  });
};

export { serveAbout };
