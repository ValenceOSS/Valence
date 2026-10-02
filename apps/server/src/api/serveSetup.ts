import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { suggestTrustedOrigins } from '@ValenceServer/setup/suggestTrustedOrigins';
import {
  setupStatusRoute,
  setupCompleteRoute,
  setupFlowFinishRoute,
} from '@ValenceServer/routes/SetupRoute';
import { placeholderEmailOf } from '@ValenceServer/accounts/placeholderEmailOf';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const SignedUpSchema = z.object({ user: z.object({ id: z.string() }) });

/**
 * Registers the setup endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSetup = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, settings, countUsers, promoteToAdmin, requires } = context;

  app.openapi(setupStatusRoute, async (context) => {
    const detectedOrigin = new URL(context.req.url).origin;
    const isComplete = (await countUsers()) > 0;

    return context.json(
      {
        isComplete,
        isFlowOpen: isComplete && (await settings.read()).setupFlow === 'open',
        detectedOrigin,
        isSecureContext: detectedOrigin.startsWith('https://'),
        suggestedTrustedOrigins: suggestTrustedOrigins(detectedOrigin),
      },
      200,
    );
  });

  app.openapi(setupCompleteRoute, async (context) => {
    if ((await countUsers()) > 0) {
      return context.json(refuse('error.setup.setupHasAlreadyBeenCompleted'), 409);
    }

    const { admin, trustedOrigins, cookieSecure } = context.req.valid('json');
    const email = admin.email?.toLowerCase();

    const created = await auth.api.signUpEmail({
      body: {
        name: admin.name,
        email: email ?? placeholderEmailOf(randomUUID()),
        password: admin.password,
        username: admin.username,
        displayUsername: admin.username,
      },
      asResponse: true,
    });

    const signedUp = created.ok
      ? SignedUpSchema.safeParse(await created.json().catch(() => null))
      : null;

    if (signedUp === null || !signedUp.success) {
      return context.json(refuse('error.setup.theAdministratorAccountCouldNotBe'), 400);
    }

    const userId = signedUp.data.user.id;
    const held = email ?? placeholderEmailOf(userId);

    if (email === undefined) {
      await (await auth.$context).internalAdapter.updateUser(userId, { email: held });
    }

    const ownerAccountId = await promoteToAdmin(held);

    const previous = await settings.read();

    await settings.write({
      trustedOrigins,
      cookieSecure,
      setupCompletedAt: new Date().toISOString(),
      setupFlow: 'open',
      ...(ownerAccountId === null ? {} : { ownerAccountId }),
    });

    for (const cookie of created.headers.getSetCookie()) {
      context.header('set-cookie', cookie, { append: true });
    }

    return context.json(
      {
        isComplete: true as const,
        isSignedIn: created.headers.getSetCookie().length > 0,
        restartRequired: previous.cookieSecure !== cookieSecure,
      },
      200,
    );
  });

  app.openapi(setupFlowFinishRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'administrator'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    await settings.write({ setupFlow: 'finished' });

    return context.json({ isFlowOpen: false as const }, 200);
  });
};

export { serveSetup };
