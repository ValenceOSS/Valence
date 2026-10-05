import { createMiddleware } from 'hono/factory';
import { ClientKindSchema } from '@ValenceContracts/schemas/ClientKind';
import { CLIENT_KIND_HEADER } from '@ValenceContracts/constants/CLIENT_KIND_HEADER';
import { refuse } from '@ValenceI18n/refuse';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';

const ALWAYS_ANSWERED = new Set(['/api/about', '/api/health']);

/**
 * Turns away a request from an app the administrator has turned off, by the app it says it is. What
 * the server is and whether it is up are still answered, so a turned-off app can say why it cannot
 * go further rather than failing to reach anything.
 *
 * @param closedApps - The apps turned off now, asked for each request so a change takes effect at once.
 * @returns The middleware.
 */
const createAppGate = (closedApps: () => Promise<readonly ClientKind[]>) =>
  createMiddleware(async (context, next) => {
    const app = ClientKindSchema.safeParse(context.req.header(CLIENT_KIND_HEADER));

    if (
      app.success &&
      !ALWAYS_ANSWERED.has(context.req.path) &&
      (await closedApps()).includes(app.data)
    ) {
      return context.json(refuse('error.access.thisAppIsTurnedOff'), 403);
    }

    await next();

    return undefined;
  });

export { createAppGate };
