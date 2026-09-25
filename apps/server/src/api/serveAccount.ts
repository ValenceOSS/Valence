import { say } from '@ValenceI18n/say';
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
    inviteAccount,
    editAccount,
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

  app.openapi(listAccountsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const listed = (await listUsers?.()) ?? [];

    const accounts = await Promise.all(
      listed.map(async (account) => {
        const held = await permissions.rolesFor(account.id);
        const resolved = await permissions.resolve(account.id);

        return {
          id: account.id,
          name: account.name,
          email: account.email,
          createdAt: account.createdAt,
          isBanned: (await isAccountBanned?.(account.id)) ?? false,
          banReason: (await readBanReason?.(account.id)) ?? null,
          position: held.length === 0 ? null : Math.max(...held.map((role) => role.position)),
          isAdministrator: resolved.has('administrator'),
          face: (await households?.read(account.id, account.name)) ?? null,
          profile: ((await profiles?.list(account.id)) ?? [])[0] ?? null,
          roles: held.map((role) => role.name),
        };
      }),
    );

    return context.json({ accounts }, 200);
  });

  app.openapi(banAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json({ error: say('server.errors.wouldLeaveNoAdministrator') }, 400);
      }
    }

    if (!(await banAccount?.(userId, reason))) {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(unbanAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if (!(await unbanAccount?.(userId))) {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(removeAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json({ error: say('server.errors.wouldLeaveNoAdministrator') }, 400);
      }
    }

    if (!(await removeAccount?.(userId))) {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(inviteAccountRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.invite'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const invited = await inviteAccount?.(context.req.valid('json'));

    if (invited === undefined || invited === null) {
      return context.json({ error: say('server.errors.addressInUse') }, 400);
    }

    return context.json(
      {
        id: invited.id,
        name: invited.name,
        email: invited.email,
        createdAt: invited.createdAt,
        isBanned: false,
        banReason: null,
        position: null,
        isAdministrator: false,
        face: null,
        roles: [],
      },
      201,
    );
  });

  app.openapi(editAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const body = context.req.valid('json');
    const changed = await editAccount?.(userId, {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.email === undefined ? {} : { email: body.email }),
    });

    if (changed === undefined || changed === 'missing') {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    if (changed === 'taken') {
      return context.json({ error: say('server.errors.addressInUse') }, 400);
    }

    return context.body(null, 204);
  });

  app.openapi(resetAccountPasswordRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const { password } = context.req.valid('json');
    const changed = await resetAccountPassword?.(userId, password);

    if (changed === undefined || !changed) {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(listAccountSessionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.security'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    await endAccountSessions?.(userId);

    return context.body(null, 204);
  });

  app.openapi(endAccountSessionRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    await endAccountSession?.(userId, sessionId);

    return context.body(null, 204);
  });

  app.openapi(setAccountAvatarRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.profiles')) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const body = context.req.valid('json');
    const changed = await setAccountAvatar?.(userId, {
      ...(body.avatar === undefined ? {} : { avatar: body.avatar }),
      ...(body.colour === undefined ? {} : { colour: body.colour }),
    });

    if (changed === undefined || !changed) {
      return context.json({ error: say('server.errors.noSuchAccount') }, 404);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });

  app.put('/api/admin/accounts/:userId/photo', tooBigToRead(), async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.profiles'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
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
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const wrong = await setAccountPhoto?.(userId, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== undefined && wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json({ error: said.error }, said.status);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });
};

export { serveAccount };
