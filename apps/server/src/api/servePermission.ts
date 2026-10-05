import { listMyPermissionsRoute } from '@ValenceServer/routes/PermissionRoute';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the permission endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePermission = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, grantsOf, isOnTheDemo } = context;

  app.openapi(listMyPermissionsRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const held = await grantsOf(headers);

    return context.json(
      {
        permissions: [...held],
        isAdministrator: held.has(ADMINISTRATOR),
        isDemo: await isOnTheDemo(headers),
      },
      200,
    );
  });
};

export { servePermission };
