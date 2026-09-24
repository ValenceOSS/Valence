import { healthRoute } from '@ValenceServer/routes/HealthRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the health endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveHealth = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION, isTranscoderReachable } = context;

  app.openapi(healthRoute, async (context) => {
    const transcoderReachable = await isTranscoderReachable();

    return context.json(
      {
        status: transcoderReachable ? ('ok' as const) : ('degraded' as const),
        version: SERVER_VERSION,
        transcoderReachable,
      },
      200,
    );
  });
};

export { serveHealth };
