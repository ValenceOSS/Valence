import { suggestTrustedOrigins } from '@ValenceServer/setup/suggestTrustedOrigins';
import { setupStatusRoute, setupCompleteRoute } from '@ValenceServer/routes/SetupRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the setup endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSetup = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, settings, countUsers, promoteToAdmin } = context;

  app.openapi(setupStatusRoute, async (context) => {
    const detectedOrigin = new URL(context.req.url).origin;

    return context.json(
      {
        isComplete: (await countUsers()) > 0,
        detectedOrigin,
        isSecureContext: detectedOrigin.startsWith('https://'),
        suggestedTrustedOrigins: suggestTrustedOrigins(detectedOrigin),
      },
      200,
    );
  });

  app.openapi(setupCompleteRoute, async (context) => {
    if ((await countUsers()) > 0) {
      return context.json({ error: 'Setup has already been completed.' }, 409);
    }

    const { admin, trustedOrigins, cookieSecure } = context.req.valid('json');

    const created = await auth.api.signUpEmail({
      body: { name: admin.name, email: admin.email, password: admin.password },
      asResponse: true,
    });

    if (!created.ok) {
      return context.json({ error: 'The administrator account could not be created.' }, 400);
    }

    const ownerAccountId = await promoteToAdmin(admin.email);

    const previous = await settings.read();

    await settings.write({
      trustedOrigins,
      cookieSecure,
      setupCompletedAt: new Date().toISOString(),
      ...(ownerAccountId === null ? {} : { ownerAccountId }),
    });

    return context.json(
      { isComplete: true as const, restartRequired: previous.cookieSecure !== cookieSecure },
      200,
    );
  });
};

export { serveSetup };
