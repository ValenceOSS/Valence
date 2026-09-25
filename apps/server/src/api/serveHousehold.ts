import { say } from '@ValenceI18n/say';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { HOUSEHOLD_LIMITS } from '@ValenceServer/household/HouseholdPicture';
import {
  readOnboardingRoute,
  changeHouseholdRoute,
  finishOnboardingRoute,
} from '@ValenceServer/routes/HouseholdRoute';
import { SPLASHSCREEN_LIMITS } from '@ValenceServer/splashscreen/SplashscreenStore';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { drawAvatar, isAvatarStyle } from '@ValenceServer/profiles/drawAvatar';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the household endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveHousehold = (app: OpenAPIHono, context: AppContext): void => {
  const {
    auth,
    settings,
    profiles,
    households,
    splashscreen,
    tooBigToRead,
    SignInBodySchema,
    requires,
    announceProfiles,
    readAccount,
  } = context;

  app.openapi(readOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const [household, isOnboarded] = await Promise.all([
      households.read(account.id, account.name),
      households.isOnboarded(account.id),
    ]);

    return context.json({ isOnboarded, household }, 200);
  });

  app.openapi(changeHouseholdRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await households.change(account.id, context.req.valid('json'));

    return context.json(await households.read(account.id, account.name), 200);
  });

  app.openapi(finishOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await households.finishOnboarding(account.id);

    return context.body(null, 204);
  });

  app.get('/api/account/avatar', async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const picture = await households.readAvatar(account.id);

    if (picture === null) {
      return context.json({ error: say('server.errors.householdNoPicture') }, 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP header value
            'private, max-age=31536000, immutable',
    });
  });

  app.get('/api/admin/accounts/:userId/avatar', async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const picture = await households?.readAvatar(context.req.param('userId'));

    if (picture === undefined || picture === null) {
      return context.json({ error: say('server.errors.householdNoPicture') }, 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP header value
            'private, max-age=31536000, immutable',
    });
  });

  app.put('/api/account/photo', tooBigToRead(HOUSEHOLD_LIMITS), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const wrong = await households.savePhoto(account.id, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, HOUSEHOLD_LIMITS);

      return context.json({ error: said.error }, said.status);
    }

    return context.body(null, 204);
  });

  app.get('/api/profiles/:profileId/avatar', async (context) => {
    const picture = await profiles?.readAvatar(context.req.param('profileId'));

    if (picture === undefined || picture === null) {
      return context.json({ error: say('server.errors.profileNoPicture') }, 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP header value
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.get('/api/appearance', async (context) => {
    const { roundness } = await settings.read();

    return context.json({ roundness }, 200);
  });

  app.get('/api/profiles/everyone', async (context) => {
    const everyone = await profiles?.listEveryone();

    return context.json(
      { profiles: everyone ?? [], splashscreen: await splashscreen.address() },
      200,
    );
  });

  app.get('/api/splashscreen', async (context) => {
    const picture = await splashscreen.read();

    if (picture === null) {
      return context.json({ error: say('server.errors.noSignInPicture') }, 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP header value
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.put('/api/admin/splashscreen', tooBigToRead(SPLASHSCREEN_LIMITS), async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const wrong = await splashscreen.save({
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, SPLASHSCREEN_LIMITS);

      return context.json({ error: said.error }, said.status);
    }

    return context.json({ splashscreen: await splashscreen.address() }, 200);
  });

  app.delete('/api/admin/splashscreen', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    return context.json({ removed: await splashscreen.remove() }, 200);
  });

  app.post('/api/profiles/:profileId/sign-in', async (context) => {
    if (profiles === undefined) {
      return context.json({ error: say('server.errors.noSuchProfile') }, 404);
    }

    const body = await context.req.text().catch(() => '');
    const parsed = SignInBodySchema.safeParse(JsonValueSchema.parse(JSON.parse(body || 'null')));

    if (!parsed.success) {
      return context.json({ error: say('server.errors.passwordRequired') }, 400);
    }

    const email = await profiles.findSignInEmail(context.req.param('profileId'));

    if (email === null) {
      return context.json({ error: say('server.errors.noSuchProfile') }, 404);
    }

    const forwarded = new Headers(context.req.raw.headers);

    forwarded.set('content-type', 'application/json');
    forwarded.delete('content-length');

    return auth.handler(
      new Request(new URL('/api/auth/sign-in/email', context.req.url), {
        method: 'POST',
        headers: forwarded,
        body: JSON.stringify({ email, password: parsed.data.password }),
      }),
    );
  });

  app.get('/api/profiles/avatars/:style', (context) => {
    const style = context.req.param('style');
    const seed = context.req.query('seed') ?? 'valence';

    if (!isAvatarStyle(style)) {
      return context.json({ error: say('server.errors.noSuchStyle') }, 404);
    }

    return context.body(drawAvatar(style, seed), 200, {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400',
    });
  });

  app.put('/api/profiles/:profileId/photo', tooBigToRead(), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const wrong = await profiles.savePhoto(account.id, context.req.param('profileId'), {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json({ error: said.error }, said.status);
    }

    await announceProfiles(account.id);

    return context.body(null, 204);
  });
};

export { serveHousehold };
