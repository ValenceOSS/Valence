import { withCaller } from '@ValenceServer/web/withCaller';
import { BrandSettingsSchema, NO_BRAND } from '@ValenceContracts/schemas/Brand';
import { bodyOf } from '@ValenceI18n/bodyOf';
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
import { refuse } from '@ValenceI18n/refuse';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { isDemoAccount } from '@ValenceServer/demo/isDemoAccount';
import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { secretMatches } from '@ValenceServer/locks/secretMatches';

const PIN_TRIES = 5;

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
    demoAccounts,
    households,
    splashscreen,
    brandLogo,
    tooBigToRead,
    SignInBodySchema,
    requires,
    announceProfiles,
    readAccount,
    callerOf,
    listUsers,
    children,
  } = context;
  const pinTries = new Map<string, { count: number; sinceMs: number }>();

  const signsInWith = async (userId: string) => {
    if ((await children.ownerOf(userId)) === null) {
      return null;
    }

    return (await children.pinHashOf(userId)) === null ? 'nothing' : 'pin';
  };

  app.openapi(readOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
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
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await households.change(account.id, context.req.valid('json'));

    return context.json(await households.read(account.id, account.name), 200);
  });

  app.openapi(finishOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await households.finishOnboarding(account.id);

    return context.body(null, 204);
  });

  app.get('/api/account/avatar', async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const picture = await households.readAvatar(account.id);

    if (picture === null) {
      return context.json(refuse('error.household.thatHouseholdHasNoPicture'), 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : 'private, max-age=31536000, immutable',
    });
  });

  app.get('/api/admin/accounts/:userId/avatar', async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const picture = await households?.readAvatar(context.req.param('userId'));

    if (picture === undefined || picture === null) {
      return context.json(refuse('error.household.thatHouseholdHasNoPicture'), 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : 'private, max-age=31536000, immutable',
    });
  });

  app.put('/api/account/photo', tooBigToRead(HOUSEHOLD_LIMITS), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const wrong = await households.savePhoto(account.id, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, HOUSEHOLD_LIMITS);

      return context.json(bodyOf(said), said.status);
    }

    return context.body(null, 204);
  });

  app.get('/api/profiles/:profileId/avatar', async (context) => {
    const picture = await profiles?.readAvatar(context.req.param('profileId'));

    if (picture === undefined || picture === null) {
      return context.json(refuse('error.household.thatProfileHasNoPicture'), 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.get('/api/appearance', async (context) => {
    const { roundness, brand } = await settings.read();

    return context.json(
      {
        roundness,
        brand: {
          ...BrandSettingsSchema.catch(NO_BRAND).parse(brand),
          logo: await brandLogo.address(),
        },
      },
      200,
    );
  });

  app.get('/api/profiles/everyone', async (context) => {
    const everyone = (await profiles?.listEveryone()) ?? [];
    const signsIn =
      listUsers === undefined
        ? null
        : new Set(
            (await listUsers())
              .filter((account) => account.canSignIn ?? true)
              .map((account) => account.id),
          );
    const shown =
      profiles === undefined
        ? everyone
        : (
            await Promise.all(
              everyone.map(async (profile) => {
                const owner = await profiles.accountOf(profile.id);
                const asChild = owner === null ? null : await signsInWith(owner);

                if (asChild !== null) {
                  return [{ ...profile, signsInWith: asChild }];
                }

                if (signsIn !== null && (owner === null || !signsIn.has(owner))) {
                  return [];
                }

                if (demoAccounts.length === 0) {
                  return [profile];
                }

                const account = await profiles.findSignIn(profile.id);

                return account !== null && isDemoAccount(account, demoAccounts) ? [profile] : [];
              }),
            )
          ).flat();

    return context.json(
      {
        profiles: shown,
        splashscreen: await splashscreen.address(),
        message: (await settings.read()).wayInMessage,
      },
      200,
    );
  });

  app.get('/api/splashscreen', async (context) => {
    const picture = await splashscreen.read();

    if (picture === null) {
      return context.json(refuse('error.household.thisServerHasNoPictureBehind'), 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.put('/api/admin/splashscreen', tooBigToRead(SPLASHSCREEN_LIMITS), async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const wrong = await splashscreen.save({
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, SPLASHSCREEN_LIMITS);

      return context.json(bodyOf(said), said.status);
    }

    return context.json({ splashscreen: await splashscreen.address() }, 200);
  });

  app.delete('/api/admin/splashscreen', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json({ removed: await splashscreen.remove() }, 200);
  });

  app.post('/api/profiles/:profileId/sign-in', async (context) => {
    if (profiles === undefined) {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    const body = await context.req.text().catch(() => '');
    const sent = JsonValueSchema.catch(null).parse(JSON.parse(body || 'null'));
    const parsed = SignInBodySchema.safeParse(sent);
    const profileId = context.req.param('profileId');
    const childId = await profiles.accountOf(profileId);
    const asChild = childId === null ? null : await signsInWith(childId);

    if (childId !== null && asChild !== null) {
      if (asChild === 'pin') {
        const nowMs = Date.now();
        const tried = pinTries.get(childId);
        const recent = tried !== undefined && nowMs - tried.sinceMs < MINUTE_MS ? tried : null;

        if (recent !== null && recent.count >= PIN_TRIES) {
          return context.json(refuse('error.libraryLock.tooManyTries'), 429);
        }

        const held = await children.pinHashOf(childId);

        if (!parsed.success || held === null || !secretMatches(parsed.data.password, held)) {
          pinTries.set(childId, {
            count: (recent?.count ?? 0) + 1,
            sinceMs: recent?.sinceMs ?? nowMs,
          });

          return context.json(refuse('error.children.thatPinIsWrong'), 401);
        }

        pinTries.delete(childId);
      }

      return auth.api.signInTheDemo({
        body: { userId: childId },
        headers: context.req.raw.headers,
        asResponse: true,
      });
    }

    if (!parsed.success && demoAccounts.length === 0) {
      return context.json(refuse('error.household.aPasswordIsRequired'), 400);
    }

    const account = await profiles.findSignIn(profileId);

    if (account === null) {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    const userId = isDemoAccount(account, demoAccounts)
      ? await profiles.accountOf(profileId)
      : null;

    if (userId !== null) {
      return auth.api.signInTheDemo({
        body: { userId },
        headers: context.req.raw.headers,
        asResponse: true,
      });
    }

    if (!parsed.success) {
      return context.json(refuse('error.household.aPasswordIsRequired'), 400);
    }

    const byUsername = realEmailOf(account.email) === null && account.username !== null;

    const forwarded = new Headers(context.req.raw.headers);

    forwarded.set('content-type', 'application/json');
    forwarded.delete('content-length');

    return auth.handler(
      await withCaller(
        new Request(
          new URL(
            byUsername ? '/api/auth/sign-in/username' : '/api/auth/sign-in/email',
            context.req.url,
          ),
          {
            method: 'POST',
            headers: forwarded,
            body: JSON.stringify(
              byUsername
                ? { username: account.username, password: parsed.data.password }
                : { email: account.email, password: parsed.data.password },
            ),
          },
        ),
        callerOf?.(context) ?? null,
      ),
    );
  });

  app.get('/api/profiles/avatars/:style', (context) => {
    const style = context.req.param('style');
    const seed = context.req.query('seed') ?? 'valence';

    if (!isAvatarStyle(style)) {
      return context.json(refuse('error.household.noSuchStyle'), 404);
    }

    return context.body(drawAvatar(style, seed), 200, {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400',
    });
  });

  app.put('/api/profiles/:profileId/photo', tooBigToRead(), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const wrong = await profiles.savePhoto(account.id, context.req.param('profileId'), {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json(bodyOf(said), said.status);
    }

    await announceProfiles(account.id);

    return context.body(null, 204);
  });
};

export { serveHousehold };
