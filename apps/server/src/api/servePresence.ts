import {
  presenceHeartbeatRoute,
  presenceStopWatchingRoute,
} from '@ValenceServer/routes/PresenceRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the presence endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePresence = (app: OpenAPIHono, context: AppContext): void => {
  const { presence, isTheDeviceOfWhoeverIsAsking } = context;

  app.openapi(presenceHeartbeatRoute, async (context) => {
    const { clientId } = context.req.valid('param');
    const { isPlaying, health } = context.req.valid('json');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    presence.heartbeatPlayback(clientId, isPlaying, health);

    return context.body(null, 204);
  });

  app.openapi(presenceStopWatchingRoute, async (context) => {
    const { clientId } = context.req.valid('param');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    presence.stopPlayback(clientId);

    return context.body(null, 204);
  });
};

export { servePresence };
