import { say } from '@ValenceI18n/say';
import { listMyPermissionsRoute } from '@ValenceServer/routes/PermissionRoute';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import { narrowToKey } from '@ValenceServer/auth/narrowToKey';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the permission endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePermission = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, permissions, apiKeys } = context;

  app.openapi(listMyPermissionsRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const resolved = await permissions.resolve(session.user.id);

    const held =
      headers.get('x-api-key') === null
        ? resolved
        : narrowToKey(resolved, await apiKeys.restrictionFor(headers, session.session.id));

    return context.json({ permissions: [...held], isAdministrator: held.has(ADMINISTRATOR) }, 200);
  });
};

export { servePermission };
