import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { createDatabasePermissionService } from './createDatabasePermissionService';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A permission service over a fresh database holding one account.
 *
 * @returns The service.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });

  return createDatabasePermissionService(db);
};

describe('createDatabasePermissionService', () => {
  it(
    'says whether there was a role to delete',
    async () => {
      const service = await aService();
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
      const service = await aService();
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
      const service = await aService();

      await service.setOverride('ada', { permission: 'media.delete', effect: 'allow' });
      await service.setOverride('ada', { permission: 'media.delete', effect: 'deny' });

      await expect(service.overridesFor('ada')).resolves.toEqual([
        { permission: 'media.delete', effect: 'deny' },
      ]);
    },
    STARTING_POSTGRES_MS,
  );
});
