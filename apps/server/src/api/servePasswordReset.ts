import { requestPasswordResetRoute } from '@ValenceServer/routes/PasswordResetRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the endpoint somebody who forgot their password asks for a reset link at, before they
 * are signed in.
 *
 * @param app - The application to register it on.
 * @param context - What it is answered with.
 */
const servePasswordReset = (app: OpenAPIHono, context: AppContext): void => {
  const { requestPasswordReset } = context;

  app.openapi(requestPasswordResetRoute, async (context) => {
    const { redirectTo, ...ask } = context.req.valid('json');

    await requestPasswordReset(ask, redirectTo);

    return context.json({ requested: true } as const, 202);
  });
};

export { servePasswordReset };
