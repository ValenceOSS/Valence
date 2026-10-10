import { bodyOf } from '@ValenceI18n/bodyOf';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { describeDevice } from '@ValenceServer/account/describeDevice';
import { checkAccountAction } from '@ValenceServer/auth/checkAccountAction';
import {
  listAccountsRoute,
  banAccountRoute,
  unbanAccountRoute,
  removeAccountRoute,
  inviteAccountRoute,
  editAccountRoute,
  resetAccountPasswordRoute,
  listAccountSessionsRoute,
  endAccountSessionsRoute,
  endAccountSessionRoute,
  setAccountAvatarRoute,
} from '@ValenceServer/routes/AccountRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { DEFAULT_SETUP_LINK_LIFETIME } from '@ValenceContracts/schemas/SetupLink';
import { linkOriginOf } from '@ValenceServer/accounts/setupLinks/linkOriginOf';
import type { SetupStanding } from '@ValenceServer/accounts/setupLinks/SetupLinkService';

/**
 * Registers the account endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAccount = (app: OpenAPIHono, context: AppContext): void => {
  const {
    profiles,
    households,
    listUsers,
    permissions,
    banAccount,
    unbanAccount,
    removeAccount,
    isAccountBanned,
    readBanReason,
    editAccount,
    setupLinks,
    createAccountWithoutPassword,
    email,
    settings,
    trustedOrigins,
    resetAccountPassword,
    listAccountSessions,
    endAccountSessions,
    endAccountSession,
    setAccountPhoto,
    setAccountAvatar,
    tooBigToRead,
    describeAccountRefusal,
    requires,
    announceProfiles,
    theOwner,
    readActor,
  } = context;

  /**
   * Describes every account as the admin pages show it, with what each holds and where it stands.
   *
   * @returns The accounts.
   */
  const describeAccounts = async () => {
    const listed = (await listUsers?.()) ?? [];
    const standings =
      (await setupLinks?.statesOf(listed.map((one) => one.id))) ?? new Map<string, SetupStanding>();

    return Promise.all(
      listed.map(async (account) => {
        const held = await permissions.rolesFor(account.id);
        const resolved = await permissions.resolve(account.id);
        const standing = standings.get(account.id);

        return {
          id: account.id,
          name: account.name,
          username: account.username ?? null,
          discordId: account.discordId ?? null,
          email: realEmailOf(account.email),
          createdAt: account.createdAt,
          isBanned: (await isAccountBanned?.(account.id)) ?? false,
          banReason: (await readBanReason?.(account.id)) ?? null,
          position: held.length === 0 ? null : Math.max(...held.map((role) => role.position)),
          isAdministrator: resolved.has('administrator'),
          face: (await households?.read(account.id, account.name)) ?? null,
          profile: ((await profiles?.list(account.id)) ?? [])[0] ?? null,
          roles: held.map((role) => role.name),
          canSignIn: account.canSignIn ?? true,
          lastSignedInAt: account.lastSignedInAt ?? null,
          setup: {
            state: standing?.state ?? 'none',
            expiresAt: standing?.expiresAt?.toISOString() ?? null,
          },
        };
      }),
    );
  };

  app.openapi(listAccountsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(
      {
        accounts: await describeAccounts(),
        canEmailSetupLinks: await email.isOn('setupLinks'),
      },
      200,
    );
  });

  app.openapi(banAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');
    const { reason } = context.req.valid('json');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json(describeAccountRefusal(refusal), 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json(refuse('error.common.thatWouldLeaveNobodyAbleTo'), 400);
      }
    }

    if (!(await banAccount?.(userId, reason))) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    return context.body(null, 204);
  });

  app.openapi(unbanAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json(describeAccountRefusal(refusal), 403);
    }

    if (!(await unbanAccount?.(userId))) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    return context.body(null, 204);
  });

  app.openapi(removeAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json(describeAccountRefusal(refusal), 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json(refuse('error.common.thatWouldLeaveNobodyAbleTo'), 400);
      }
    }

    if (!(await removeAccount?.(userId))) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    return context.body(null, 204);
  });

  app.openapi(inviteAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.invite')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    if (createAccountWithoutPassword === undefined || setupLinks === undefined) {
      return context.json(refuse('error.common.theAccountCouldNotBeMade'), 500);
    }

    const body = context.req.valid('json');

    if (body.email !== undefined && realEmailOf(body.email) === null) {
      return context.json(refuse('error.account.thatAddressCannotBeUsed'), 400);
    }

    const made = await createAccountWithoutPassword({
      name: body.name,
      ...(body.username === undefined ? {} : { username: body.username }),
      ...(body.email === undefined ? {} : { email: body.email }),
      by: actor.id,
    });

    if (made.kind === 'taken') {
      return context.json(
        refuse(
          made.field === 'username'
            ? 'error.account.thatUsernameIsAlreadyInUse'
            : 'error.account.thatAddressIsAlreadyInUse',
        ),
        400,
      );
    }

    if (made.kind === 'failed') {
      return context.json(refuse('error.common.theAccountCouldNotBeMade'), 500);
    }

    const setupLink =
      body.password === undefined
        ? await setupLinks.issue(made.userId, {
            lifetimeDays: body.lifetimeDays ?? DEFAULT_SETUP_LINK_LIFETIME,
            by: actor.id,
            origin: linkOriginOf(
              context.req.raw.headers,
              await (trustedOrigins?.() ?? settings.read().then((read) => read.trustedOrigins)),
            ),
          })
        : null;

    if (body.password !== undefined) {
      await resetAccountPassword?.(made.userId, body.password);
    }

    const account = (await describeAccounts()).find((one) => one.id === made.userId);

    if (account === undefined) {
      return context.json(refuse('error.common.theAccountCouldNotBeMade'), 500);
    }

    return context.json(
      {
        account,
        setupLink:
          setupLink === null
            ? null
            : { url: setupLink.url, expiresAt: setupLink.expiresAt.toISOString() },
      },
      201,
    );
  });

  app.openapi(editAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    const body = context.req.valid('json');

    if (body.email !== undefined && body.email !== null && realEmailOf(body.email) === null) {
      return context.json(refuse('error.account.thatAddressCannotBeUsed'), 400);
    }

    const changed = await editAccount?.(userId, {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.username === undefined ? {} : { username: body.username }),
      ...(body.email === undefined ? {} : { email: body.email }),
      ...(body.discordId === undefined ? {} : { discordId: body.discordId }),
    });

    if (changed === undefined || changed === 'missing') {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    if (changed === 'taken') {
      return context.json(refuse('error.account.thatAddressIsAlreadyInUse'), 400);
    }

    if (changed === 'usernameTaken') {
      return context.json(refuse('error.account.thatUsernameIsAlreadyInUse'), 400);
    }

    return context.body(null, 204);
  });

  app.openapi(resetAccountPasswordRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    const { password } = context.req.valid('json');
    const changed = await resetAccountPassword?.(userId, password);

    if (changed === undefined || !changed) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    return context.body(null, 204);
  });

  app.openapi(listAccountSessionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.security'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');
    const held = (await listAccountSessions?.(userId)) ?? [];

    return context.json(
      {
        sessions: held.map((one) => ({
          id: one.id,
          name: describeDevice(one.userAgent),
          address: one.ipAddress,
          signedInAt: one.createdAt,
          expiresAt: one.expiresAt,
        })),
      },
      200,
    );
  });

  app.openapi(endAccountSessionsRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    await endAccountSessions?.(userId);

    return context.body(null, 204);
  });

  app.openapi(endAccountSessionRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId, sessionId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    await endAccountSession?.(userId, sessionId);

    return context.body(null, 204);
  });

  app.openapi(setAccountAvatarRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.profiles')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    const body = context.req.valid('json');
    const changed = await setAccountAvatar?.(userId, {
      ...(body.avatar === undefined ? {} : { avatar: body.avatar }),
      ...(body.colour === undefined ? {} : { colour: body.colour }),
    });

    if (changed === undefined || !changed) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });

  app.put('/api/admin/accounts/:userId/photo', tooBigToRead(), async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.profiles'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const actor = await readActor(context.req.raw.headers);
    const userId = context.req.param('userId');

    if (actor !== null && actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json(describeAccountRefusal(refusal), 403);
      }
    }

    const wrong = await setAccountPhoto?.(userId, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== undefined && wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json(bodyOf(said), said.status);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });
};

export { serveAccount };
