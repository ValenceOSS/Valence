import { frameFromQuery } from '@ValenceServer/pictures/frameFromQuery';
import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import { withCaller } from '@ValenceServer/web/withCaller';
import { BrandSettingsSchema, NO_BRAND } from '@ValenceContracts/schemas/Brand';
import { bodyOf } from '@ValenceI18n/bodyOf';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { HOUSEHOLD_LIMITS } from '@ValenceServer/household/HouseholdPicture';
import { NAME_MAX as PROFILE_NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';
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
import { faceBeforeAnyProfile } from '@ValenceServer/household/faceBeforeAnyProfile';
import { fitProfileName } from '@ValenceServer/household/fitProfileName';

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
    faces,
    splashscreen,
    brandLogo,
    tooBigToRead,
    SignInBodySchema,
    requires,
    announceProfiles,
    readAccount,
    readActing,
    callerOf,
    listUsers,
    recordAudit,
  } = context;

  /**
   * Finds how to sign in to the account a way-in id was kept for, which is how an account that holds
   * no profile yet is chosen there.
   *
   * @param wayInId - The id chosen on the way in.
   * @returns The account's address and username, or nothing where no account keeps that id.
   */
  const signInBeforeAnyProfile = async (
    wayInId: string,
  ): Promise<{ email: string; username: string | null } | null> => {
    const accountId = (await households?.accountOfWayIn(wayInId)) ?? null;
    const account =
      accountId === null ? undefined : (await listUsers?.())?.find((one) => one.id === accountId);

    return account === undefined
      ? null
      : { email: account.email, username: account.username ?? null };
  };

  app.openapi(readOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined || faces === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const [household, isOnboarded] = await Promise.all([
      faces.read(account.id, account.name),
      households.isOnboarded(account.id),
    ]);

    return context.json({ isOnboarded, household }, 200);
  });

  app.openapi(changeHouseholdRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || faces === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const changed = await faces.change(account.id, context.req.valid('json'));

    if (changed === 'tooLong') {
      return context.json(
        refuse('error.household.keepANameToMostCharacters', { most: PROFILE_NAME_MAX.toString() }),
        400,
      );
    }

    await announceProfiles(account.id);

    return context.json(await faces.read(account.id, account.name), 200);
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

    if (account === null || faces === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const picture = await faces.readPicture(account.id, context.req.query('framed') !== undefined);

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

    const picture = await faces?.readPicture(
      context.req.param('userId'),
      context.req.query('framed') !== undefined,
    );

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

    if (account === null || faces === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const wrong = await faces.savePhoto(
      account.id,
      {
        body: new Uint8Array(await context.req.arrayBuffer()),
        contentType: context.req.header('content-type') ?? '',
      },
      frameFromQuery(context.req.query()),
    );

    if (wrong !== null) {
      const said = describePictureFault(wrong, HOUSEHOLD_LIMITS);

      return context.json(bodyOf(said), said.status);
    }

    await announceProfiles(account.id);

    return context.body(null, 204);
  });

  app.get('/api/profiles/:profileId/avatar', async (context) => {
    const profileId = context.req.param('profileId');
    const isSignedIn = (await readActing(context.req.raw.headers)) !== null;

    if (!isSignedIn && (await profiles?.standingOf(profileId))?.isOwner !== true) {
      return context.json(refuse('error.household.thatProfileHasNoPicture'), 404);
    }

    const picture = await profiles?.readAvatar(
      profileId,
      context.req.query('framed') !== undefined,
    );

    if (picture === undefined || picture === null) {
      return context.json(refuse('error.household.thatProfileHasNoPicture'), 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.get('/api/profiles/:profileId/household', async (context) => {
    const profileId = context.req.param('profileId');
    const standing = await profiles?.standingOf(profileId);
    const accountId =
      standing === null || standing === undefined
        ? await households?.accountOfWayIn(profileId)
        : standing.isOwner
          ? await profiles?.accountOf(profileId)
          : null;
    const picture =
      accountId === null || accountId === undefined
        ? null
        : await faces?.readPicture(accountId, context.req.query('framed') !== undefined);

    if (picture === undefined || picture === null) {
      return context.json(refuse('error.household.thatHouseholdHasNoPicture'), 404);
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
    const accounts = listUsers === undefined ? null : await listUsers();
    const signsIn =
      accounts === null
        ? null
        : new Set(
            accounts.filter((account) => account.canSignIn ?? true).map((account) => account.id),
          );
    const ownerOf = new Map(
      profiles === undefined
        ? []
        : await Promise.all(
            everyone.map(
              async (profile) => [profile.id, await profiles.accountOf(profile.id)] as const,
            ),
          ),
    );
    const shown =
      profiles === undefined
        ? everyone
        : (
            await Promise.all(
              everyone.map(async (profile) => {
                const owner = signsIn === null ? null : (ownerOf.get(profile.id) ?? null);

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

    const names = new Map((accounts ?? []).map((account) => [account.id, account.name]));
    const shownFaces = await Promise.all(
      shown.map(async (profile) => {
        const accountId = faces === undefined ? null : ownerOf.get(profile.id);

        if (faces === undefined || accountId === null || accountId === undefined) {
          return profile;
        }

        const household = await faces.read(accountId, names.get(accountId) ?? profile.name);

        return {
          ...profile,
          name: fitProfileName(household.name),
          colour: household.colour,
          avatar: household.avatar,
          updatedAt: household.updatedAt,
          pictureUrl: `/api/profiles/${profile.id}/household?v=${encodeURIComponent(household.updatedAt)}`,
        };
      }),
    );

    const owners = new Set(
      [...ownerOf.values()].flatMap((owner) => (owner === null ? [] : [owner])),
    );
    const faceless =
      accounts === null ||
      profiles === undefined ||
      households === undefined ||
      faces === undefined ||
      demoAccounts.length > 0
        ? []
        : (
            await Promise.all(
              accounts
                .filter((account) => (account.canSignIn ?? true) && !owners.has(account.id))
                .map(async (account) => {
                  const wayInId = await households.wayInOf(account.id);

                  return wayInId === null
                    ? []
                    : [
                        faceBeforeAnyProfile(
                          wayInId,
                          await faces.read(account.id, account.name),
                          account.createdAt,
                        ),
                      ];
                }),
            )
          ).flat();

    return context.json(
      {
        profiles: [...shownFaces, ...faceless].sort((one, other) =>
          one.name.localeCompare(other.name),
        ),
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

    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'splashscreen' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ splashscreen: await splashscreen.address() }, 200);
  });

  app.delete('/api/admin/splashscreen', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const removed = await splashscreen.remove();

    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'splashscreen' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ removed }, 200);
  });

  app.post('/api/profiles/:profileId/sign-in', async (context) => {
    if (profiles === undefined) {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    const body = await context.req.text().catch(() => '');
    const parsed = SignInBodySchema.safeParse(JsonValueSchema.parse(JSON.parse(body || 'null')));

    if (!parsed.success && demoAccounts.length === 0) {
      return context.json(refuse('error.household.aPasswordIsRequired'), 400);
    }

    const profileId = context.req.param('profileId');
    const account =
      (await profiles.findSignIn(profileId)) ?? (await signInBeforeAnyProfile(profileId));

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
    const acting = await readActing(context.req.raw.headers);
    const profileId = context.req.param('profileId');

    if (acting === null || profiles === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    if (acting.profile === null || (!acting.profile.isOwner && acting.profile.id !== profileId)) {
      return context.json(refuse('error.profiles.onlyTheOwnerCanDoThat'), 403);
    }

    const account = acting.account;
    const wrong = await profiles.savePhoto(account.id, profileId, {
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
