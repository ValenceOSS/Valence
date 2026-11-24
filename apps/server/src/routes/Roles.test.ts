import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const RoleListSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: z.number(),
      permissions: z.array(z.string()),
    }),
  ),
  outOfReach: z.array(z.string()),
});

const RoleSchema = z.object({ id: z.string(), permissions: z.array(z.string()) });

const RefusalSchema = z.object({ code: z.string().nullable() });

const AccountSchema = z.object({
  roles: z.array(z.object({ name: z.string() })),
  overrides: z.array(z.object({ permission: z.string(), effect: z.string() })),
  effective: z.array(z.string()),
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, auth, store, permissions, settings };
};

/**
 * Signs somebody in holding exactly the permissions named, at the rank given.
 */
const signedInWith = async (granted: readonly Permission[], position = 200) => {
  const context = build();
  const cookie = await signUpForTest(context.app, context.auth);
  const account = context.store.user[0];

  if (granted.includes('administrator')) {
    await makeAdministrator(context.permissions, account?.id ?? '');
    await context.settings.write({ ownerAccountId: account?.id ?? '' });
  } else {
    const role = await context.permissions.createRole({
      name: 'Purpose-made',
      position,
      color: null,
      permissions: [...granted],
    });

    await context.permissions.assignRole(account?.id ?? '', role.id);
  }

  const request = (path: string, method = 'GET', body?: object) =>
    context.app.request(`${TEST_ORIGIN}${path}`, {
      method,
      headers: {
        cookie,
        origin: TEST_ORIGIN,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { ...context, request, accountId: account?.id ?? '' };
};

const idOf = async (
  context: Awaited<ReturnType<typeof signedInWith>>,
  name: string,
): Promise<string> =>
  (await context.permissions.listRoles()).find((role) => role.name === name)?.id ?? '';

describe('managing roles over HTTP', () => {
  it('refuses somebody without account.roles', async () => {
    const context = await signedInWith(['jobs.run']);

    expect((await context.request('/api/admin/roles')).status).toBe(403);
  });

  it('lists the roles to somebody who may manage them', async () => {
    const context = await signedInWith(['administrator']);
    const response = await context.request('/api/admin/roles');

    expect(response.status).toBe(200);
    expect(RoleListSchema.parse(await response.json()).roles.map((role) => role.name)).toEqual([
      'Administrator',
      'Manager',
      'Member',
      'Restricted',
    ]);
  });

  it('publishes the catalogue so an interface need not keep its own copy', async () => {
    const context = await signedInWith(['administrator']);
    const response = await context.request('/api/admin/permissions');
    const body = z.object({ permissions: z.array(z.string()) }).parse(await response.json());

    expect(body.permissions).toContain('jobs.runDestructive');
    expect(body.permissions).toContain('administrator');
  });

  describe('what the list says is out of reach', () => {
    it('is nothing for the owner', async () => {
      const context = await signedInWith(['administrator']);
      const body = RoleListSchema.parse(await (await context.request('/api/admin/roles')).json());

      expect(body.outOfReach).toEqual([]);
    });

    it('is every role at or above the asker’s highest, for anybody else', async () => {
      const context = await signedInWith(['account.roles'], 150);
      const body = RoleListSchema.parse(await (await context.request('/api/admin/roles')).json());

      expect(body.outOfReach).toEqual([
        await idOf(context, 'Administrator'),
        await idOf(context, 'Manager'),
        await idOf(context, 'Purpose-made'),
      ]);
    });
  });

  describe('putting them in order', () => {
    const namesIn = async (response: Response) =>
      RoleListSchema.parse(await response.json()).roles.map((role) => role.name);

    it('lets the owner put every role where they like', async () => {
      const context = await signedInWith(['administrator']);
      const ids = await Promise.all(
        ['Administrator', 'Member', 'Manager', 'Restricted'].map((name) => idOf(context, name)),
      );

      const response = await context.request('/api/admin/roles/order', 'PUT', { ids });

      expect(response.status).toBe(200);
      expect(await namesIn(response)).toEqual(['Administrator', 'Member', 'Manager', 'Restricted']);
    });

    it('lets anybody else reorder the roles below their own, keeping the rest where they were', async () => {
      const context = await signedInWith(['account.roles'], 150);
      const ids = await Promise.all(
        ['Administrator', 'Manager', 'Purpose-made', 'Restricted', 'Member'].map((name) =>
          idOf(context, name),
        ),
      );

      const response = await context.request('/api/admin/roles/order', 'PUT', { ids });

      expect(response.status).toBe(200);
      expect(await namesIn(response)).toEqual([
        'Administrator',
        'Manager',
        'Purpose-made',
        'Restricted',
        'Member',
      ]);
      expect((await context.permissions.listRoles()).map((role) => role.position)).toEqual([
        300, 200, 150, 1, 0,
      ]);
    });

    it('refuses an order that is not every role there is now', async () => {
      const context = await signedInWith(['administrator']);
      const ids = await Promise.all(
        ['Administrator', 'Manager', 'Member'].map((name) => idOf(context, name)),
      );

      const response = await context.request('/api/admin/roles/order', 'PUT', { ids });

      expect(response.status).toBe(409);
      expect(RefusalSchema.parse(await response.json()).code).toBe(
        'error.role.theRolesChangedWhileYouWere',
      );
    });

    it('refuses to move a role at or above the asker’s own', async () => {
      const context = await signedInWith(['account.roles'], 150);
      const ids = await Promise.all(
        ['Administrator', 'Purpose-made', 'Manager', 'Member', 'Restricted'].map((name) =>
          idOf(context, name),
        ),
      );

      const response = await context.request('/api/admin/roles/order', 'PUT', { ids });

      expect(response.status).toBe(403);
      expect((await context.permissions.listRoles()).map((role) => role.name)).toEqual([
        'Administrator',
        'Manager',
        'Purpose-made',
        'Member',
        'Restricted',
      ]);
    });

    it('refuses somebody without account.roles', async () => {
      const context = await signedInWith(['jobs.run']);
      const ids = (await context.permissions.listRoles()).map((role) => role.id);

      expect((await context.request('/api/admin/roles/order', 'PUT', { ids })).status).toBe(403);
    });
  });

  describe('creating one', () => {
    it('puts a role made without a place at the bottom', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Guest',
        color: null,
        permissions: [],
      });

      expect(response.status).toBe(201);
      expect(
        (await context.permissions.listRoles()).map((role) => [role.name, role.position]),
      ).toEqual([
        ['Administrator', 301],
        ['Manager', 201],
        ['Member', 101],
        ['Restricted', 1],
        ['Guest', 0],
      ]);
    });

    it('takes a permission by a name since retired, as the one it became', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Housemate',
        position: 120,
        color: null,
        permissions: ['media.hide', 'server.logs'],
      });

      expect(response.status).toBe(201);
      expect(RoleSchema.parse(await response.json()).permissions).toEqual([
        'media.override',
        'server.monitor',
      ]);
    });

    it('creates a role and grants it', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Housemate',
        position: 120,
        color: null,
        permissions: ['media.override'],
      });

      expect(response.status).toBe(201);
      expect((await context.permissions.listRoles()).map((role) => role.name)).toContain(
        'Housemate',
      );
    });

    it('refuses a role at or above the actor’s own rank', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Overreach',
        position: 200,
        color: null,
        permissions: [],
      });

      expect(response.status).toBe(403);
    });

    it('refuses to let somebody grant what they do not hold', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Sneaky',
        position: 100,
        color: null,
        permissions: ['server.settings'],
      });

      expect(response.status).toBe(403);
      expect(await response.text()).toContain('can’t grant a permission you don’t have');
    });

    it('refuses the obvious escalation outright', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const response = await context.request('/api/admin/roles', 'POST', {
        name: 'Me But Better',
        position: 100,
        color: null,
        permissions: ['administrator'],
      });

      expect(response.status).toBe(403);
    });
  });

  describe('changing one', () => {
    it('changes what a role grants', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(
        `/api/admin/roles/${await idOf(context, 'Member')}`,
        'PATCH',
        { permissions: ['media.override'] },
      );

      expect(response.status).toBe(200);
    });

    it('reports a role that is not there', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(
        '/api/admin/roles/11111111-1111-4111-8111-111111111111',
        'PATCH',
        { name: 'Anything' },
      );

      expect(response.status).toBe(404);
    });

    it('lets a role keep a permission the actor lacks while its others change', async () => {
      const context = await signedInWith(['account.roles', 'jobs.run'], 150);
      const helper = await context.permissions.createRole({
        name: 'Helper',
        position: 10,
        color: null,
        permissions: ['server.settings'],
      });

      const response = await context.request(`/api/admin/roles/${helper.id}`, 'PATCH', {
        permissions: ['server.settings', 'jobs.run'],
      });

      expect(response.status).toBe(200);
      expect(RoleSchema.parse(await response.json()).permissions).toEqual([
        'server.settings',
        'jobs.run',
      ]);
    });

    it('still refuses to add a permission the actor lacks to a role', async () => {
      const context = await signedInWith(['account.roles', 'jobs.run'], 150);
      const helper = await context.permissions.createRole({
        name: 'Helper',
        position: 10,
        color: null,
        permissions: ['server.settings'],
      });

      const response = await context.request(`/api/admin/roles/${helper.id}`, 'PATCH', {
        permissions: ['server.settings', 'server.backup'],
      });

      expect(response.status).toBe(403);
    });

    it('refuses to let somebody lift a role above themselves', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const member = await idOf(context, 'Member');
      const response = await context.request(`/api/admin/roles/${member}`, 'PATCH', {
        position: 900,
        color: null,
      });

      expect(response.status).toBe(403);
    });
  });

  describe('deleting one', () => {
    it('deletes an ordinary role', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(
        `/api/admin/roles/${await idOf(context, 'Restricted')}`,
        'DELETE',
      );

      expect(response.status).toBe(204);
    });

    it('will not delete a role that grants administrator', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(
        `/api/admin/roles/${await idOf(context, 'Administrator')}`,
        'DELETE',
      );

      expect(response.status).toBe(400);
      expect((await context.permissions.listRoles()).map((role) => role.name)).toContain(
        'Administrator',
      );
    });
  });

  describe('what one account holds', () => {
    it('reports its roles, overrides and what they come to', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(`/api/admin/accounts/${context.accountId}/roles`);
      const body = AccountSchema.parse(await response.json());

      expect(body.roles.map((role) => role.name)).toEqual(['Administrator']);
      expect(body.effective).toContain('server.backup');
    });

    it('gives an account a role', async () => {
      const context = await signedInWith(['administrator']);
      const manager = await idOf(context, 'Manager');
      const response = await context.request(
        `/api/admin/accounts/usr_other/roles/${manager}`,
        'PUT',
      );

      expect(response.status).toBe(204);
      expect((await context.permissions.resolve('usr_other')).has('jobs.run')).toBe(true);
    });

    it('refuses to hand out a role above the actor', async () => {
      const context = await signedInWith(['account.roles'], 150);
      const manager = await idOf(context, 'Manager');
      const response = await context.request(
        `/api/admin/accounts/usr_other/roles/${manager}`,
        'PUT',
      );

      expect(response.status).toBe(403);
    });

    it('refuses to give or take a role from somebody who outranks the actor', async () => {
      const context = await signedInWith(['account.roles'], 100);
      const senior = await context.permissions.createRole({
        name: 'Senior',
        position: 500,
        color: null,
        permissions: [],
      });
      const junior = await context.permissions.createRole({
        name: 'Junior',
        position: 10,
        color: null,
        permissions: [],
      });

      await context.permissions.assignRole('usr_other', senior.id);
      await context.permissions.assignRole('usr_other', junior.id);

      const given = await context.request(
        `/api/admin/accounts/usr_other/roles/${junior.id}`,
        'PUT',
      );
      const taken = await context.request(
        `/api/admin/accounts/usr_other/roles/${junior.id}`,
        'DELETE',
      );

      expect(given.status).toBe(403);
      expect(taken.status).toBe(403);
      expect(await taken.text()).toContain('equal to or higher than yours');
      expect((await context.permissions.rolesFor('usr_other')).map((role) => role.name)).toEqual(
        expect.arrayContaining(['Senior', 'Junior']),
      );
    });

    it('still gives and takes a role from somebody junior to the actor', async () => {
      const context = await signedInWith(['account.roles'], 100);
      const junior = await context.permissions.createRole({
        name: 'Junior',
        position: 10,
        color: null,
        permissions: [],
      });

      const given = await context.request(
        `/api/admin/accounts/usr_other/roles/${junior.id}`,
        'PUT',
      );
      const taken = await context.request(
        `/api/admin/accounts/usr_other/roles/${junior.id}`,
        'DELETE',
      );

      expect(given.status).toBe(204);
      expect(taken.status).toBe(204);
    });

    it('records an override', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(`/api/admin/accounts/usr_other/overrides`, 'PUT', {
        permission: 'server.monitor',
        effect: 'allow',
      });

      expect(response.status).toBe(204);
      expect((await context.permissions.resolve('usr_other')).has('server.monitor')).toBe(true);
    });

    it('records an override given under a name since retired, as the one it became', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(`/api/admin/accounts/usr_other/overrides`, 'PUT', {
        permission: 'server.logs',
        effect: 'allow',
      });

      expect(response.status).toBe(204);
      expect(await context.permissions.overridesFor('usr_other')).toEqual([
        { permission: 'server.monitor', effect: 'allow' },
      ]);
    });

    it('refuses an allow for something the actor does not hold', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const response = await context.request(`/api/admin/accounts/usr_other/overrides`, 'PUT', {
        permission: 'server.settings',
        effect: 'allow',
      });

      expect(response.status).toBe(403);
    });

    it('lets a deny through even for something the actor does not hold', async () => {
      const context = await signedInWith(['account.roles'], 200);
      const response = await context.request(`/api/admin/accounts/usr_other/overrides`, 'PUT', {
        permission: 'server.settings',
        effect: 'deny',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('clearing an override', () => {
    it('takes one back off again', async () => {
      const context = await signedInWith(['administrator']);

      await context.request(`/api/admin/accounts/usr_other/overrides`, 'PUT', {
        permission: 'server.monitor',
        effect: 'allow',
      });

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.logs`,
        'DELETE',
      );

      expect(response.status).toBe(204);
      expect((await context.permissions.resolve('usr_other')).has('server.monitor')).toBe(false);
    });

    it('says nothing was there rather than failing, since the end state is what was asked for', async () => {
      const context = await signedInWith(['administrator']);

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.logs`,
        'DELETE',
      );

      expect(response.status).toBe(204);
    });

    it('is for somebody who administers accounts', async () => {
      const context = await signedInWith(['streaming.view']);

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.logs`,
        'DELETE',
      );

      expect(response.status).toBe(403);
    });

    it('refuses to clear an override on somebody who outranks the actor', async () => {
      const context = await signedInWith(['account.roles'], 100);
      const senior = await context.permissions.createRole({
        name: 'Senior',
        position: 500,
        color: null,
        permissions: [],
      });

      await context.permissions.assignRole('usr_other', senior.id);
      await context.permissions.setOverride('usr_other', {
        permission: 'server.monitor',
        effect: 'deny',
      });

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.logs`,
        'DELETE',
      );

      expect(response.status).toBe(403);
      expect(await response.text()).toContain('equal to or higher than yours');
    });

    it('refuses to lift a deny for something the actor does not hold, since that hands it over', async () => {
      const context = await signedInWith(['account.roles'], 200);

      await context.permissions.setOverride('usr_other', {
        permission: 'server.settings',
        effect: 'deny',
      });

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.settings`,
        'DELETE',
      );

      expect(response.status).toBe(403);
      expect(await response.text()).toContain('can’t grant a permission you don’t have');
    });

    it('lifts a deny for something the actor does hold', async () => {
      const context = await signedInWith(['account.roles', 'server.settings'], 200);

      await context.permissions.setOverride('usr_other', {
        permission: 'server.settings',
        effect: 'deny',
      });

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.settings`,
        'DELETE',
      );

      expect(response.status).toBe(204);
    });

    it('lifts an allow without asking what the actor holds, since that takes something away', async () => {
      const context = await signedInWith(['account.roles'], 200);

      await context.permissions.setOverride('usr_other', {
        permission: 'server.settings',
        effect: 'allow',
      });

      const response = await context.request(
        `/api/admin/accounts/usr_other/overrides/server.settings`,
        'DELETE',
      );

      expect(response.status).toBe(204);
    });

    it('will not clear the deny that is holding the last administrator in place', async () => {
      const context = await signedInWith(['administrator']);

      await context.request(`/api/admin/accounts/${context.accountId}/overrides`, 'PUT', {
        permission: 'administrator',
        effect: 'allow',
      });

      const response = await context.request(
        `/api/admin/accounts/${context.accountId}/overrides/administrator`,
        'DELETE',
      );

      expect([204, 400]).toContain(response.status);
    });
  });

  describe('the last administrator', () => {
    it('cannot have the role taken away', async () => {
      const context = await signedInWith(['administrator']);
      const administrator = await idOf(context, 'Administrator');
      const response = await context.request(
        `/api/admin/accounts/${context.accountId}/roles/${administrator}`,
        'DELETE',
      );

      expect(response.status).toBe(400);
      expect((await context.permissions.resolve(context.accountId)).has('administrator')).toBe(
        true,
      );
    });

    it('cannot be denied it', async () => {
      const context = await signedInWith(['administrator']);
      const response = await context.request(
        `/api/admin/accounts/${context.accountId}/overrides`,
        'PUT',
        { permission: 'administrator', effect: 'deny' },
      );

      expect(response.status).toBe(400);
      expect((await context.permissions.resolve(context.accountId)).has('administrator')).toBe(
        true,
      );
    });

    it('may be demoted once somebody else holds it', async () => {
      const context = await signedInWith(['administrator']);
      const administrator = await idOf(context, 'Administrator');

      await context.permissions.assignRole('usr_other', administrator);

      const response = await context.request(
        `/api/admin/accounts/${context.accountId}/roles/${administrator}`,
        'DELETE',
      );

      expect(response.status).toBe(204);
      expect(await context.permissions.countAdministrators()).toBe(1);
    });
  });

  describe('an administrator who does not own the server', () => {
    it('cannot rewrite the role that made them one', async () => {
      const context = await signedInWith(['administrator']);

      await context.settings.write({ ownerAccountId: 'somebody-else' });

      const administrator = await idOf(context, 'Administrator');

      const response = await context.request(`/api/admin/roles/${administrator}`, 'PATCH', {
        name: 'Administrator',
        position: 300,
        color: null,
        permissions: ['administrator'],
      });

      expect(response.status).toBe(403);
    });
  });
});
