import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { rolePermission, user, userPermissionOverride } from '#dialect/Schema';
import { createDatabasePermissionService } from './createDatabasePermissionService';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A permission service over a fresh database holding one account.
 *
 * @returns The service, and the database under it.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });

  return { db, service: createDatabasePermissionService(db) };
};

describe('createDatabasePermissionService', () => {
  it(
    'says whether there was a role to delete',
    async () => {
      const { service } = await aService();
      const made = await service.createRole({
        name: 'Friends',
        position: 1,
        color: null,
        permissions: [],
      });

      await expect(service.deleteRole(made.id)).resolves.toBe(true);
      await expect(service.deleteRole(made.id)).resolves.toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'gives a role once however often it is given',
    async () => {
      const { service } = await aService();
      const made = await service.createRole({
        name: 'Friends',
        position: 1,
        color: null,
        permissions: [],
      });

      await service.assignRole('ada', made.id);
      await service.assignRole('ada', made.id);

      await expect(service.rolesFor('ada')).resolves.toHaveLength(1);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the last word on a permission set for somebody',
    async () => {
      const { service } = await aService();

      await service.setOverride('ada', { permission: 'media.delete', effect: 'allow' });
      await service.setOverride('ada', { permission: 'media.delete', effect: 'deny' });

      await expect(service.overridesFor('ada')).resolves.toEqual([
        { permission: 'media.delete', effect: 'deny' },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps a denial where a retired name and its successor both have an override',
    async () => {
      const { db, service } = await aService();

      await db.insert(userPermissionOverride).values([
        { userId: 'ada', permission: 'account.manage', effect: 'allow' },
        { userId: 'ada', permission: 'account.ban', effect: 'deny' },
        { userId: 'ada', permission: 'account.security', effect: 'allow' },
      ]);

      await expect(service.overridesFor('ada')).resolves.toEqual([
        { permission: 'account.manage', effect: 'deny' },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'replaces an override stored under a retired name when one is set under its successor',
    async () => {
      const { db, service } = await aService();

      await db
        .insert(userPermissionOverride)
        .values({ userId: 'ada', permission: 'server.logs', effect: 'deny' });
      await service.setOverride('ada', { permission: 'server.monitor', effect: 'allow' });

      await expect(service.overridesFor('ada')).resolves.toEqual([
        { permission: 'server.monitor', effect: 'allow' },
      ]);
      expect((await db.select().from(userPermissionOverride)).map((row) => row.permission)).toEqual(
        ['server.monitor'],
      );
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'clears an override stored under a retired name along with its successor’s',
    async () => {
      const { db, service } = await aService();

      await db.insert(userPermissionOverride).values([
        { userId: 'ada', permission: 'media.override', effect: 'allow' },
        { userId: 'ada', permission: 'media.hide', effect: 'deny' },
      ]);
      await service.clearOverride('ada', 'media.override');

      await expect(service.overridesFor('ada')).resolves.toEqual([]);
      expect(await db.select().from(userPermissionOverride)).toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'gives a role a permission once however often it is listed',
    async () => {
      const { service } = await aService();
      const made = await service.createRole({
        name: 'Friends',
        position: 1,
        color: null,
        permissions: ['jobs.run', 'jobs.run'],
      });

      expect((await service.listRoles()).find((one) => one.id === made.id)?.permissions).toEqual([
        'jobs.run',
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'reads a role’s retired permission as its successor, once',
    async () => {
      const { db, service } = await aService();
      const made = await service.createRole({
        name: 'Friends',
        position: 1,
        color: null,
        permissions: ['jobs.run'],
      });

      await db.insert(rolePermission).values({ roleId: made.id, permission: 'jobs.schedule' });

      expect((await service.listRoles()).find((one) => one.id === made.id)?.permissions).toEqual([
        'jobs.run',
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'moves roles to the places it is given',
    async () => {
      const { service } = await aService();
      const lower = await service.createRole({
        name: 'Lower',
        position: 1,
        color: null,
        permissions: [],
      });
      const higher = await service.createRole({
        name: 'Higher',
        position: 2,
        color: null,
        permissions: [],
      });

      await service.rankRoles(
        new Map([
          [lower.id, 4],
          [higher.id, 3],
        ]),
      );

      expect(
        (await service.listRoles())
          .filter((one) => one.id === lower.id || one.id === higher.id)
          .map((one) => [one.name, one.position]),
      ).toEqual([
        ['Lower', 4],
        ['Higher', 3],
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'lists roles sharing a place by name',
    async () => {
      const { service } = await aService();

      for (const name of ['Zebra', 'Aardvark', 'Mongoose']) {
        await service.createRole({ name, position: 7, color: null, permissions: [] });
      }

      expect(
        (await service.listRoles()).filter((one) => one.position === 7).map((one) => one.name),
      ).toEqual(['Aardvark', 'Mongoose', 'Zebra']);
    },
    STARTING_POSTGRES_MS,
  );
});
