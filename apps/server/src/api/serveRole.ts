import { checkRoleChange } from '@ValenceServer/auth/checkRoleChange';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import {
  listPermissionsRoute,
  listRolesRoute,
  createRoleRoute,
  updateRoleRoute,
  deleteRoleRoute,
  listAccountRolesRoute,
  assignRoleRoute,
  removeRoleRoute,
  setOverrideRoute,
  clearOverrideRoute,
} from '@ValenceServer/routes/RoleRoute';
import type { Role } from '@ValenceContracts/schemas/Permission';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the role endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveRole = (app: OpenAPIHono, context: AppContext): void => {
  const {
    requests,
    permissions,
    describeAccountRefusal,
    describeRefusal,
    sayRoleChanged,
    requires,
    theOwner,
    readActor,
    outranks,
    wouldStrandTheServer,
  } = context;

  app.openapi(listPermissionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json(
      {
        permissions: PERMISSIONS.filter(
          (permission) => requests !== null || !permission.startsWith('requests.'),
        ),
      },
      200,
    );
  });

  app.openapi(listRolesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json({ roles: await permissions.listRoles() }, 200);
  });

  app.openapi(createRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const body = context.req.valid('json');
    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: body.position,
      granting: body.permissions,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    return context.json(await permissions.createRole({ ...body, color: body.color ?? null }), 201);
  });

  app.openapi(updateRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { id } = context.req.valid('param');
    const body = context.req.valid('json');
    const existing = (await permissions.listRoles()).find((role) => role.id === id);

    if (existing === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: Math.max(existing.position, body.position ?? existing.position),
      granting: body.permissions ?? [],
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    const before = existing.permissions;
    const patch = {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.position === undefined ? {} : { position: body.position }),
      ...(body.permissions === undefined ? {} : { permissions: body.permissions }),
      ...(body.color === undefined ? {} : { color: body.color }),
    };

    const holding: { updated: Role | null } = { updated: null };

    const stranded = await wouldStrandTheServer(
      async () => {
        holding.updated = await permissions.updateRole(id, patch);
      },
      async () => {
        await permissions.updateRole(id, { permissions: before });
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    if (holding.updated === null) {
      return context.json({ error: 'No such role.' }, 404);
    }

    return context.json(holding.updated, 200);
  });

  app.openapi(deleteRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { id } = context.req.valid('param');
    const existing = (await permissions.listRoles()).find((role) => role.id === id);

    if (existing === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: existing.position,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    if (existing.permissions.includes('administrator')) {
      return context.json(
        {
          error:
            'A role granting administrator cannot be deleted. Change what it grants, or move its holders first.',
        },
        400,
      );
    }

    await permissions.deleteRole(id);

    return context.body(null, 204);
  });

  app.openapi(listAccountRolesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    return context.json(
      {
        roles: await permissions.rolesFor(userId),
        overrides: await permissions.overridesFor(userId),
        effective: [...(await permissions.resolve(userId))],
      },
      200,
    );
  });

  app.openapi(assignRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, roleId } = context.req.valid('param');
    const role = (await permissions.listRoles()).find((candidate) => candidate.id === roleId);

    if (role === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: role.position,
      granting: role.permissions,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    await permissions.assignRole(userId, roleId);
    await sayRoleChanged(userId, role.name, 'given');

    return context.body(null, 204);
  });

  app.openapi(removeRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, roleId } = context.req.valid('param');
    const role = (await permissions.listRoles()).find((candidate) => candidate.id === roleId);

    if (role !== undefined) {
      const refusal = checkRoleChange({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        actorPermissions: actor.permissions,
        targetPosition: role.position,
      });

      if (refusal !== null) {
        return context.json({ error: describeRefusal(refusal) }, 403);
      }
    }

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.removeRole(userId, roleId);
      },
      async () => {
        await permissions.assignRole(userId, roleId);
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    await sayRoleChanged(userId, role?.name ?? 'a role', 'taken');

    return context.body(null, 204);
  });

  app.openapi(setOverrideRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const grant = context.req.valid('json');

    if (outranks(actor, userId, await permissions.rolesFor(userId), await theOwner())) {
      return context.json({ error: describeAccountRefusal('outranked') }, 403);
    }

    if (grant.effect === 'allow' && !actor.permissions.has(grant.permission)) {
      return context.json({ error: describeRefusal('escalation') }, 403);
    }

    const previous = (await permissions.overridesFor(userId)).find(
      (existing) => existing.permission === grant.permission,
    );

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.setOverride(userId, grant);
      },
      async () => {
        if (previous === undefined) {
          await permissions.clearOverride(userId, grant.permission);

          return;
        }

        await permissions.setOverride(userId, previous);
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    return context.body(null, 204);
  });

  app.openapi(clearOverrideRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, permission } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    if (outranks(actor, userId, target, await theOwner())) {
      return context.json({ error: describeAccountRefusal('outranked') }, 403);
    }

    const previous = (await permissions.overridesFor(userId)).find(
      (existing) => existing.permission === permission,
    );

    if (previous?.effect === 'deny' && !actor.permissions.has(permission)) {
      return context.json({ error: describeRefusal('escalation') }, 403);
    }

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.clearOverride(userId, permission);
      },
      async () => {
        if (previous !== undefined) {
          await permissions.setOverride(userId, previous);
        }
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    return context.body(null, 204);
  });
};

export { serveRole };
